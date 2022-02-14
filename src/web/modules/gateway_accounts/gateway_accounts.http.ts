/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'
import { stringify } from 'qs'

import logger from '../../../lib/logger'

import {
  Connector, AdminUsers, PublicAuth, Products
} from '../../../lib/pay-request'
import { wrapAsyncErrorHandler } from '../../../lib/routes'
import { extractFiltersFromQuery, toAccountSearchParams } from '../../../lib/gatewayAccounts'

import GatewayAccountFormModel from './gatewayAccount.model'
import { Service } from '../../../lib/pay-request/types/adminUsers'
import { Product } from '../../../lib/pay-request/types/products'
import { GatewayAccount as CardGatewayAccount } from '../../../lib/pay-request/types/connector'
import { ClientFormError } from '../common/validationErrorFormat'
import * as config from '../../../config'
import { format } from './csv'
import { formatWithAdminEmails } from './csv_with_admin_emails'
import { createCsvWithAdminEmailsData, createCsvData } from './csv_data'
import CreateAgentInitiatedMotoProductFormRequest from './CreateAgentInitiatedMotoProductFormRequest'
import { formatErrorsForTemplate } from '../common/validationErrorFormat'
import { EntityNotFoundError, IOValidationError } from '../../../lib/errors'

import * as stripeClient from '../../../lib/stripe/stripe.client'

async function overview(req: Request, res: Response): Promise<void> {
  const filters = extractFiltersFromQuery(req.query)
  const searchParams = toAccountSearchParams(filters)

  const { accounts } = await Connector.accounts(searchParams)

  res.render('gateway_accounts/overview', {
    card: true,
    accounts,
    messages: req.flash('info'),
    filters,
    total: accounts.length.toLocaleString(),
    csvUrl: `gateway_accounts/csv?${stringify(filters)}`,
    csvWithAdminEmailsUrl: `gateway_accounts/csvWithAdminEmails?${stringify(filters)}`
  })
}

async function listCSVWithAdminEmails(req: Request, res: Response): Promise<void> {
  const filters = extractFiltersFromQuery(req.query)
  const data = await createCsvWithAdminEmailsData(filters)
  res.set('Content-Type', 'text/csv')
  res.set('Content-Disposition', `attachment; filename="GOVUK_Pay_gateway_accounts_with_admin_emails_${stringify(filters)}.csv"`)
  res.status(200).send(formatWithAdminEmails(data))
}

async function listCSV(req: Request, res: Response): Promise<void> {
  const filters = extractFiltersFromQuery(req.query)
  const data = await createCsvData(filters)
  res.set('Content-Type', 'text/csv')
  res.set('Content-Disposition', `attachment; filename="GOVUK_Pay_gateway_accounts_${stringify(filters)}.csv"`)
  res.status(200).send(format(data))
}

async function create(req: Request, res: Response): Promise<void> {
  const serviceId = req.query.service
  const context: {
    linkedCredentials: string;
    recovered?: object;
    service?: Service;
    flash: object;
    errors?: ClientFormError[];
    errorMap?: object;
    csrf: string;
  } = {
    linkedCredentials: req.query.credentials as string,
    flash: req.flash(),
    csrf: req.csrfToken()
  }

  const { recovered } = req.session
  if (recovered) {
    context.recovered = recovered.formValues

    if (recovered.errors) {
      context.errors = recovered.errors
      context.errorMap = recovered.errors.reduce((aggregate: {
        [key: string]: string;
      }, error: ClientFormError) => {
        // eslint-disable-next-line no-param-reassign
        aggregate[error.id] = error.message
        return aggregate
      }, {})
    }
    delete req.session.recovered
  }

  if (serviceId) {
    const service = await AdminUsers.service(serviceId)
    context.service = service
  }
  res.render('gateway_accounts/create', context)
}

async function confirm(req: Request, res: Response): Promise<void> {
  const account = new GatewayAccountFormModel(req.body)
  res.render('gateway_accounts/confirm', { account, request: req.body, csrf: req.csrfToken() })
}

async function writeAccount(req: Request, res: Response): Promise<void> {
  const account = new GatewayAccountFormModel(req.body)
  const serviceId = req.body.systemLinkedService
  account.serviceId = serviceId

  let gatewayAccountIdDerived: string
  let createdAccount: object
  if (account.isDirectDebit) {
    throw new Error(`Adding a direct debit account is no longer supported`)
  } else {
    const cardAccount: CardGatewayAccount = await Connector.createAccount(account.formatPayload())
    createdAccount = cardAccount
    gatewayAccountIdDerived = String(cardAccount.gateway_account_id)
  }

  logger.info(`Created new Gateway Account ${gatewayAccountIdDerived}`)

  // connect system linked services to the created account
  if (serviceId) {
    await AdminUsers.updateServiceGatewayAccount(
      serviceId,
      gatewayAccountIdDerived
    )
    logger.info(`Service ${serviceId} linked to new Gateway Account ${gatewayAccountIdDerived}`)

    const serviceDetails = await AdminUsers.service(serviceId)
    const isUpdateServiceToLive = account.isLive() && serviceDetails.current_go_live_stage !== 'LIVE'

    await AdminUsers.updateServiceDetails(serviceId, isUpdateServiceToLive, account.sector, account.internalFlag)
    logger.info(`Service ${serviceId} - 'sector' updated to '${account.sector}', 'internal' updated to ${account.internalFlag}`)
  }

  const stripeAccountStatementDescriptors: {
    payoutStatementDescriptor?: string,
    statementDescriptor?: string
  } = {}

  if (account.provider === 'stripe') {
    const stripeAccountDetails = await stripeClient.getStripeApi().accounts.retrieve(account.credentials)
    stripeAccountStatementDescriptors.payoutStatementDescriptor = stripeAccountDetails.settings.payouts.statement_descriptor
    stripeAccountStatementDescriptors.statementDescriptor = stripeAccountDetails.settings.payments.statement_descriptor
  }

  // note payment_provider is not returned in the object returned from createAccount
  res.render('gateway_accounts/createSuccess', {
    account: createdAccount,
    linkedService: serviceId,
    gatewayAccountIdDerived,
    provider: account.provider,
    isLive: account.isLive(),
    isStripe: account.provider === 'stripe',
    stripeAccountStatementDescriptors,
    selfServiceBaseUrl: config.services.SELFSERVICE_URL
  })
}

async function detail(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  let services = {}
  const isDirectDebitID = id.match(/^DIRECT_DEBIT:/)

  let account, acceptedCards
  if (isDirectDebitID) {
    throw new Error(`Direct debit accounts are no longer supported`)
  } else {
    [account, acceptedCards] = await Promise.all([Connector.accountWithCredentials(id), Connector.acceptedCardTypes(id)])
  }

  try {
    services = await AdminUsers.gatewayAccountServices(id)
  } catch (error) {
    logger.warn(`Services request for gateway account ${id} returned "${error.message}"`)
  }

  const currentCredential = getCurrentCredential(account)


  res.render('gateway_accounts/detail', {
    account,
    acceptedCards,
    gatewayAccountId: id,
    services,
    currentCredential,
    messages: req.flash('info'),
    csrf: req.csrfToken()
  })
}

function getCurrentCredential(account: CardGatewayAccount) {
  const credentials = account.gateway_account_credentials || []
  return credentials.find(credential => credential.state === 'ACTIVE') || credentials[0]
}

async function apiKeys(req: Request, res: Response): Promise<void> {
  const gatewayAccountId = req.params.id

  const account = await getAccount(gatewayAccountId)
  const tokens = await PublicAuth.apiKeyTokens(gatewayAccountId)
  res.render('gateway_accounts/api_keys', { account, tokens, gatewayAccountId, messages: req.flash('info') })
}

async function deleteApiKey(req: Request, res: Response): Promise<void> {
  const { accountId, tokenId } = req.params

  await PublicAuth.deleteApiToken(accountId, tokenId)
  logger.info(`Deleted API Token with ID ${tokenId} for Gateway Account ${accountId}`)

  req.flash('info', `Token ${tokenId} successfully deleted`)
  res.redirect(`/gateway_accounts/${accountId}/api_keys`)
}

async function getAccount(id: string): Promise<any> {
  const isDirectDebitID = id.match(/^DIRECT_DEBIT:/)
  if (isDirectDebitID) {
    throw new Error(`Direct debit accounts are no longer supported`)
  }
  const readAccountMethod = Connector.account
  return readAccountMethod(id)
}

async function surcharge(req: Request, res: Response): Promise<void> {
  let service
  const { id } = req.params
  const account = await getAccount(id)

  try {
    service = await AdminUsers.gatewayAccountServices(id)
  } catch (error) {
    logger.warn(`Services request for gateway account ${id} returned "${error.message}"`)
  }

  res.render('gateway_accounts/surcharge', { account, service, csrf: req.csrfToken() })
}

async function updateSurcharge(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const surcharges = req.body

  await Connector.updateCorporateSurcharge(id, surcharges)
  req.flash('info', 'Corporate surcharge values updated')
  res.redirect(`/gateway_accounts/${id}`)
}

async function emailBranding(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const account = await getAccount(id)

  res.render('gateway_accounts/email_branding', { account, csrf: req.csrfToken() })
}

async function updateEmailBranding(req: Request, res: Response):
  Promise<void> {
  const { id } = req.params
  const notifySettings = req.body
  // eslint-disable-next-line no-underscore-dangle
  delete notifySettings._csrf

  await Connector.updateEmailBranding(id, notifySettings)
  req.flash('info', 'Email custom branding successfully updated')
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleBlockPrepaidCards(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const blocked = await Connector.toggleBlockPrepaidCards(id)

  req.flash('info', `Prepaid cards are ${blocked ? 'blocked' : 'allowed'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleMotoPayments(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const motoPaymentsEnabled = await Connector.toggleMotoPayments(id)

  req.flash('info', `MOTO payments ${motoPaymentsEnabled ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleWorldpayExemptionEngine(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  const result = await Connector.toggleWorldpayExemptionEngine(id)
  req.flash('info', `Worldpay Exception Engine ${result ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleAllowTelephonePaymentNotifications(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const enabled = await Connector.toggleAllowTelephonePaymentNotifications(id)

  req.flash('info', `Telephone payment notifications ${enabled ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleSendPayerIpAddressToGateway(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const enabled = await Connector.toggleSendPayerIpAddressToGateway(id)

  req.flash('info', `Sending payer IP address to gateway ${enabled ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleSendPayerEmailToGateway(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const enabled = await Connector.toggleSendPayerEmailToGateway(id)

  req.flash('info', `Sending payer email to gateway ${enabled ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleSendReferenceToGateway(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const enabled = await Connector.toggleSendReferenceToGateway(id)

  req.flash('info', `Sending reference (instead of description) to gateway ${enabled ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleRequiresAdditionalKycData(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const account = await getAccount(id)
  const enabled = await Connector.toggleRequiresAdditionalKycData(account.gateway_account_id, !account.requires_additional_kyc_data)

  logger.info('Requires additional KYC data flag updated for gateway account', {
    enabled: enabled,
    gateway_account_id: account.gateway_account_id,
    gateway_account_type: account.type
  })
  req.flash('info', `Requires additional KYC data ${enabled ? 'enabled' : 'disabled'} for gateway account`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function updateStripeStatementDescriptorPage(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const account = await getAccount(id)

  res.render('gateway_accounts/stripe_statement_descriptor', { account, csrf: req.csrfToken() })
}

async function updateStripePayoutDescriptorPage(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const account = await getAccount(id)
  res.render('gateway_accounts/stripe_payout_descriptor', { account, csrf: req.csrfToken() })
}

async function updateStripeStatementDescriptor(
  req: Request,
  res: Response
): Promise<void> {
  const { statement_descriptor } = req.body
  const { id } = req.params
  const { stripe_account_id } = await Connector.stripe(id)

  if (!statement_descriptor) {
    throw new Error('Cannot update empty state descriptor')
  }

  if (!stripe_account_id) {
    throw new Error('Invalid Stripe account configuration')
  }

  // @ts-ignore
  const updateParams = {
    settings: {
      payments: {
        statement_descriptor
      }
    }
  }
  await stripeClient.getStripeApi().accounts.update(
    stripe_account_id,
    // @ts-ignore
    updateParams
  )
  req.flash('info', `Statement descriptor updated to [${statement_descriptor}]`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function updateStripePayoutDescriptor(
  req: Request,
  res: Response
): Promise<void> {
  const { statement_descriptor } = req.body
  const { id } = req.params
  const { stripe_account_id } = await Connector.stripe(id)

  if (!statement_descriptor) {
    throw new Error('Cannot update empty state descriptor')
  }

  if (!stripe_account_id) {
    throw new Error('Invalid Stripe account configuration')
  }

  // @ts-ignore
  const updateParams = {
    settings: {
      payouts: {
        statement_descriptor
      }
    }
  }
  await stripeClient.getStripeApi().accounts.update(
    stripe_account_id,
    // @ts-ignore
    updateParams
  )
  req.flash('info', `Payout descriptor updated to [${statement_descriptor}]`)
  res.redirect(`/gateway_accounts/${id}`)
}

const search = async function search(req: Request, res: Response): Promise<void> {
  res.render('gateway_accounts/search', { csrf: req.csrfToken() })
}

async function searchRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  const id = req.body.id.trim()
  try {
    await Connector.account(id)
    return res.redirect(`/gateway_accounts/${id}`)
  }
  catch (err) {
    if (err instanceof EntityNotFoundError) {
      try {
        const accountByExternalId = await Connector.accountByExternalId(id)
        return res.redirect(`/gateway_accounts/${accountByExternalId.gateway_account_id}`)
      }
      catch (err) {
        if (err instanceof EntityNotFoundError) {
          const accountByPaymentProviderAccountId = await Connector.accounts({ payment_provider_account_id: id })
          if (accountByPaymentProviderAccountId['accounts'].length === 1) {
            return res.redirect(`/gateway_accounts/${accountByPaymentProviderAccountId['accounts'][0]['gateway_account_id']}`)
          }
          if (accountByPaymentProviderAccountId['accounts'].length > 1) {
            return res.redirect(`/gateway_accounts?payment_provider_account_id=${id}&live=all`)
          }
        }
      }
    }
    next(err)
  }
}

async function agentInitiatedMotoPage(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params

  const [account, service, products] = await Promise.all([
    getAccount(id),
    AdminUsers.gatewayAccountServices(id),
    Products.paymentLinksByGatewayAccountAndType(id, 'AGENT_INITIATED_MOTO')
  ])

  const context: {
    account: CardGatewayAccount;
    service: Service;
    products: Product[];
    csrf: string;
    formValues?: object;
    flash: object;
    errors?: object;
    errorMap?: object[];
  } = {
    account: account,
    service: service,
    products: products,
    flash: req.flash(),
    csrf: req.csrfToken()
  }

  const { recovered } = req.session

  if (recovered) {
    context.formValues = recovered.formValues

    if (recovered.errors) {
      context.errors = recovered.errors
      context.errorMap = recovered.errors.reduce((aggregate: {
        [key: string]: string;
      }, error: ClientFormError) => {
        // eslint-disable-next-line no-param-reassign
        aggregate[error.id] = error.message
        return aggregate
      }, {})
    }
    delete req.session.recovered
  }

  res.render('gateway_accounts/agent_initiated_moto', context)
}

async function createAgentInitiatedMotoProduct(
  req: Request,
  res: Response
): Promise<void> {
  delete req.session.recovered

  const { id: gatewayAccountId } = req.params

  let formValues
  try {
    formValues = new CreateAgentInitiatedMotoProductFormRequest(req.body)
  } catch (error) {
    if (error instanceof IOValidationError) {
      req.session.recovered = {
        formValues: req.body,
        errors: formatErrorsForTemplate(error.source)
      }
      res.redirect(`/gateway_accounts/${gatewayAccountId}/agent_initiated_moto`)
      return
    }
  }

  const account = await getAccount(gatewayAccountId)

  const apiTokenDescription = `Agent-initiated MOTO API token: ${formValues.name}`

  const createApiTokenRequest: {
    account_id: string,
    description: string,
    created_by: string,
    token_type: string,
    type: string,
    token_account_type: string
  } = {
    account_id: gatewayAccountId,
    description: apiTokenDescription,
    created_by: 'govuk-pay-support@digital.cabinet-office.gov.uk',
    token_type: 'CARD',
    type: 'PRODUCTS',
    token_account_type: account.type
  }

  const { token } = await PublicAuth.createApiToken(createApiTokenRequest)

  logger.info(`Created agent-initiated MOTO API token for gateway account ${gatewayAccountId} with description [${apiTokenDescription}]`)

  const createAgentInitiatedMotoProductRequest: {
    gateway_account_id: string,
    pay_api_token: string,
    name: string,
    description: string,
    reference_enabled: boolean,
    reference_label: string,
    reference_hint: string,
    type: string,
  } = {
    gateway_account_id: gatewayAccountId,
    pay_api_token: token,
    name: formValues.name,
    description: formValues.description,
    reference_enabled: true,
    reference_label: formValues.reference_label,
    reference_hint: formValues.reference_hint,
    type: 'AGENT_INITIATED_MOTO'
  }

  const { external_id } = await Products.createProduct(createAgentInitiatedMotoProductRequest)

  logger.info(`Created agent-initiated MOTO product with ID ${external_id} for gateway account ${gatewayAccountId}`)

  req.flash('generic', 'Agent-intiated MOTO product created')

  res.redirect(`/gateway_accounts/${gatewayAccountId}/agent_initiated_moto`)
}

export default {
  overview: wrapAsyncErrorHandler(overview),
  listCSV: wrapAsyncErrorHandler(listCSV),
  listCSVWithAdminEmails: wrapAsyncErrorHandler(listCSVWithAdminEmails),
  create: wrapAsyncErrorHandler(create),
  confirm: wrapAsyncErrorHandler(confirm),
  writeAccount: wrapAsyncErrorHandler(writeAccount),
  detail: wrapAsyncErrorHandler(detail),
  apiKeys: wrapAsyncErrorHandler(apiKeys),
  deleteApiKey: wrapAsyncErrorHandler(deleteApiKey),
  surcharge: wrapAsyncErrorHandler(surcharge),
  updateSurcharge: wrapAsyncErrorHandler(updateSurcharge),
  emailBranding: wrapAsyncErrorHandler(emailBranding),
  updateEmailBranding: wrapAsyncErrorHandler(updateEmailBranding),
  toggleBlockPrepaidCards: wrapAsyncErrorHandler(toggleBlockPrepaidCards),
  toggleMotoPayments: wrapAsyncErrorHandler(toggleMotoPayments),
  toggleAllowTelephonePaymentNotifications: wrapAsyncErrorHandler(toggleAllowTelephonePaymentNotifications),
  toggleSendPayerIpAddressToGateway: wrapAsyncErrorHandler(toggleSendPayerIpAddressToGateway),
  toggleSendPayerEmailToGateway: wrapAsyncErrorHandler(toggleSendPayerEmailToGateway),
  toggleSendReferenceToGateway: wrapAsyncErrorHandler(toggleSendReferenceToGateway),
  updateStripeStatementDescriptorPage: wrapAsyncErrorHandler(updateStripeStatementDescriptorPage),
  updateStripeStatementDescriptor: wrapAsyncErrorHandler(updateStripeStatementDescriptor),
  updateStripePayoutDescriptorPage: wrapAsyncErrorHandler(updateStripePayoutDescriptorPage),
  updateStripePayoutDescriptor: wrapAsyncErrorHandler(updateStripePayoutDescriptor),
  search: wrapAsyncErrorHandler(search),
  searchRequest: wrapAsyncErrorHandler(searchRequest),
  agentInitiatedMotoPage: wrapAsyncErrorHandler(agentInitiatedMotoPage),
  createAgentInitiatedMotoProduct: wrapAsyncErrorHandler(createAgentInitiatedMotoProduct),
  toggleWorldpayExemptionEngine: wrapAsyncErrorHandler(toggleWorldpayExemptionEngine),
  toggleRequiresAdditionalKycData: wrapAsyncErrorHandler(toggleRequiresAdditionalKycData)
}
