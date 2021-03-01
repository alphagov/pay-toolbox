/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from 'express'
import { stringify } from 'qs'

import logger from '../../../lib/logger'

import {
  Connector, DirectDebitConnector, AdminUsers, PublicAuth, Products
} from '../../../lib/pay-request'
import { wrapAsyncErrorHandler } from '../../../lib/routes'
import { extractFiltersFromQuery, toAccountSearchParams } from '../../../lib/gatewayAccounts'

import GatewayAccountFormModel from './gatewayAccount.model'
import { Service } from '../../../lib/pay-request/types/adminUsers'
import { Product } from '../../../lib/pay-request/types/products'
import DirectDebitGatewayAccount from '../../../lib/pay-request/types/directDebitConnector'
import { GatewayAccount as CardGatewayAccount } from '../../../lib/pay-request/types/connector'
import { ClientFormError } from '../common/validationErrorFormat'
import * as config from '../../../config'
import Stripe from 'stripe'
import HTTPSProxyAgent from 'https-proxy-agent'
import { format } from './csv'
import { formatWithAdminEmails } from './csv_with_admin_emails'
import { createCsvWithAdminEmailsData, createCsvData } from './csv_data'
import CreateAgentInitiatedMotoProductFormRequest from './CreateAgentInitiatedMotoProductFormRequest'
import { formatErrorsForTemplate } from '../common/validationErrorFormat'
import { IOValidationError } from '../../../lib/errors'

const stripe = new Stripe(process.env.STRIPE_ACCOUNT_API_KEY)
stripe.setApiVersion('2018-09-24')

// @ts-ignore
if (config.server.HTTPS_PROXY) stripe.setHttpAgent(new HTTPSProxyAgent(config.server.HTTPS_PROXY))

const overview = async function overview(req: Request, res: Response): Promise<void> {
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

const listCSVWithAdminEmails = async function listCSVWithAdminEmails(req: Request, res: Response): Promise<void> {
  const filters = extractFiltersFromQuery(req.query)
  const data = await createCsvWithAdminEmailsData(filters)
  res.set('Content-Type', 'text/csv')
  res.set('Content-Disposition', `attachment; filename="GOVUK_Pay_gateway_accounts_with_admin_emails_${stringify(filters)}.csv"`)
  res.status(200).send(formatWithAdminEmails(data))
}

const listCSV = async function listCSV(req: Request, res: Response): Promise<void> {
  const filters = extractFiltersFromQuery(req.query)
  const data = await createCsvData(filters)
  res.set('Content-Type', 'text/csv')
  res.set('Content-Disposition', `attachment; filename="GOVUK_Pay_gateway_accounts_${stringify(filters)}.csv"`)
  res.status(200).send(format(data))
}

const overviewDirectDebit = async function overviewDirectDebit(
  req: Request,
  res: Response
): Promise<void> {
  const { accounts } = await DirectDebitConnector.accounts()
  res.render('gateway_accounts/overview', { accounts, messages: req.flash('info') })
}

const create = async function create(req: Request, res: Response): Promise<void> {
  const linkedService = req.query.service
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

  if (linkedService) {
    const service = await AdminUsers.service(linkedService)
    context.service = service
  }
  res.render('gateway_accounts/create', context)
}

const confirm = async function confirm(req: Request, res: Response): Promise<void> {
  const account = new GatewayAccountFormModel(req.body)
  res.render('gateway_accounts/confirm', { account, request: req.body, csrf: req.csrfToken() })
}

const writeAccount = async function writeAccount(req: Request, res: Response): Promise<void> {
  const account = new GatewayAccountFormModel(req.body)
  const linkedService = req.body.systemLinkedService

  let gatewayAccountIdDerived: string
  let createdAccount: object
  if (account.isDirectDebit) {
    const directDebitAccount: DirectDebitGatewayAccount = await DirectDebitConnector.createAccount(
      account.formatPayload()
    )
    createdAccount = directDebitAccount
    gatewayAccountIdDerived = directDebitAccount.gateway_account_external_id
  } else {
    const cardAccount: CardGatewayAccount = await Connector.createAccount(account.formatPayload())
    createdAccount = cardAccount
    gatewayAccountIdDerived = String(cardAccount.gateway_account_id)
  }

  logger.info(`Created new Gateway Account ${gatewayAccountIdDerived}`)

  // connect system linked services to the created account
  if (linkedService) {
    await AdminUsers.updateServiceGatewayAccount(
      linkedService,
      gatewayAccountIdDerived
    )
    logger.info(`Service ${linkedService} linked to new Gateway Account ${gatewayAccountIdDerived}`)

    const serviceDetails = await AdminUsers.service(linkedService)
    const isUpdateServiceToLive = account.isLive() && serviceDetails.current_go_live_stage !== 'LIVE'

    await AdminUsers.updateServiceDetails(linkedService, isUpdateServiceToLive, account.sector, account.internalFlag)
    logger.info(`Service ${linkedService} - 'sector' updated to '${account.sector}', 'internal' updated to ${account.internalFlag}`)
  }

  const stripeAccountStatementDescriptors: {
    payoutStatementDescriptor?: string,
    statementDescriptor?: string
  } = {}

  if (account.provider === 'stripe') {
    const stripeAccountDetails = await stripe.accounts.retrieve(account.credentials);
    stripeAccountStatementDescriptors.payoutStatementDescriptor = stripeAccountDetails.payout_statement_descriptor
    stripeAccountStatementDescriptors.statementDescriptor = stripeAccountDetails.statement_descriptor
  }

  // note payment_provider is not returned in the object returned from createAccount
  res.render('gateway_accounts/createSuccess', {
    account: createdAccount,
    linkedService,
    gatewayAccountIdDerived,
    provider: account.provider,
    isLive: account.isLive(),
    isStripe: account.provider === 'stripe',
    stripeAccountStatementDescriptors,
    selfServiceBaseUrl: config.services.SELFSERVICE_URL
  })
}

const detail = async function detail(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  let services = {}
  const isDirectDebitID = id.match(/^DIRECT_DEBIT:/)

  let account, acceptedCards
  if (isDirectDebitID) {
    account = await DirectDebitConnector.account(id)
  } else {
    [account, acceptedCards] = await Promise.all([Connector.accountWithCredentials(id), Connector.acceptedCardTypes(id)])
  }

  try {
    services = await AdminUsers.gatewayAccountServices(id)
  } catch (error) {
    logger.warn(`Services request for gateway account ${id} returned "${error.message}"`)
  }

  res.render('gateway_accounts/detail', {
    account,
    acceptedCards,
    gatewayAccountId: id,
    services,
    messages: req.flash('info'),
    csrf: req.csrfToken()
  })
}

const apiKeys = async function apiKeys(req: Request, res: Response): Promise<void> {
  const gatewayAccountId = req.params.id

  const account = await getAccount(gatewayAccountId)
  const tokens = await PublicAuth.apiKeyTokens(gatewayAccountId)
  res.render('gateway_accounts/api_keys', { account, tokens, gatewayAccountId, messages: req.flash('info') })
}

const deleteApiKey = async function deleteApiKey(req: Request, res: Response): Promise<void> {
  const { accountId, tokenId } = req.params

  await PublicAuth.deleteApiToken(accountId, tokenId)
  logger.info(`Deleted API Token with ID ${tokenId} for Gateway Account ${accountId}`)

  req.flash('info', `Token ${tokenId} successfully deleted`)
  res.redirect(`/gateway_accounts/${accountId}/api_keys`)
}

const getAccount = async function getAccount(id: string): Promise<any> {
  const isDirectDebitID = id.match(/^DIRECT_DEBIT:/)
  const readAccountMethod = isDirectDebitID ? DirectDebitConnector.account : Connector.account
  return readAccountMethod(id)
}

const surcharge = async function surcharge(req: Request, res: Response): Promise<void> {
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

const updateSurcharge = async function updateSurcharge(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const surcharges = req.body

  await Connector.updateCorporateSurcharge(id, surcharges)
  req.flash('info', 'Corporate surcharge values updated')
  res.redirect(`/gateway_accounts/${id}`)
}

const emailBranding = async function emailBranding(req: Request, res: Response): Promise<void> {
  const { id } = req.params
  const account = await getAccount(id)

  res.render('gateway_accounts/email_branding', { account, csrf: req.csrfToken() })
}

const updateEmailBranding = async function updateEmailBranding(req: Request, res: Response):
  Promise<void> {
  const { id } = req.params
  const notifySettings = req.body
  // eslint-disable-next-line no-underscore-dangle
  delete notifySettings._csrf

  await Connector.updateEmailBranding(id, notifySettings)
  req.flash('info', 'Email custom branding successfully updated')
  res.redirect(`/gateway_accounts/${id}`)
}

const toggleBlockPrepaidCards = async function toggleBlockPrepaidCards(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const blocked = await Connector.toggleBlockPrepaidCards(id)

  req.flash('info', `Prepaid cards are ${blocked ? 'blocked' : 'allowed'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

const toggleMotoPayments = async function toggleMotoPayments(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const motoPaymentsEnabled = await Connector.toggleMotoPayments(id)

  req.flash('info', `MOTO payments ${motoPaymentsEnabled ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

const toggleAllowTelephonePaymentNotifications = async function toggleAllowTelephonePaymentNotifications(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const enabled = await Connector.toggleAllowTelephonePaymentNotifications(id)

  req.flash('info', `Telephone payment notifications ${enabled ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

const updateStripeStatementDescriptorPage = async function updateStripeStatementDescriptorPage(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const account = await getAccount(id)

  res.render('gateway_accounts/stripe_statement_descriptor', { account, csrf: req.csrfToken() })
}

const updateStripePayoutDescriptorPage = async function updateStripePayoutDescriptorPage(
  req: Request,
  res: Response
): Promise<void> {
  const { id } = req.params
  const account = await getAccount(id)

  res.render('gateway_accounts/stripe_payout_descriptor', { account, csrf: req.csrfToken() })
}

const updateStripeStatementDescriptor = async function updateStripeStatementDescriptor(
  req: Request,
  res: Response
): Promise<void> {
  const { statement_descriptor } = req.body
  const { id } = req.params
  const account = await Connector.accountWithCredentials(id)

  if (!statement_descriptor) {
    throw new Error('Cannot update empty state descriptor')
  }

  // @ts-ignore
  const updateParams = {
    settings: {
      payments: {
        statement_descriptor
      }
    }
  }
  await stripe.accounts.update(
    account.credentials.stripe_account_id,
    // @ts-ignore
    updateParams
  )
  req.flash('info', `Statement descriptor updated to [${statement_descriptor}]`)
  res.redirect(`/gateway_accounts/${id}`)
}

const updateStripePayoutDescriptor = async function updateStripePayoutDescriptor(
  req: Request,
  res: Response
): Promise<void> {
  const { statement_descriptor } = req.body
  const { id } = req.params
  const account = await Connector.accountWithCredentials(id)

  if (!statement_descriptor) {
    throw new Error('Cannot update empty state descriptor')
  }

  // @ts-ignore
  const updateParams = {
    settings: {
      payouts: {
        statement_descriptor
      }
    }
  }
  await stripe.accounts.update(
    account.credentials.stripe_account_id,
    // @ts-ignore
    updateParams
  )
  req.flash('info', `Payout descriptor updated to [${statement_descriptor}]`)
  res.redirect(`/gateway_accounts/${id}`)
}

const search = async function search(req: Request, res: Response): Promise<void> {
  res.render('gateway_accounts/search', { csrf: req.csrfToken() })
}

const searchRequest = async function searchRequest(req: Request, res: Response): Promise<void> {
  const accountId = req.body.id.trim()
  res.redirect(`/gateway_accounts/${accountId}`)
}

const agentInitiatedMotoPage = async function agentInitiatedMotoPage(
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

const createAgentInitiatedMotoProduct = async function createAgentInitiatedMotoProduct(
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
  overviewDirectDebit: wrapAsyncErrorHandler(overviewDirectDebit),
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
  updateStripeStatementDescriptorPage: wrapAsyncErrorHandler(updateStripeStatementDescriptorPage),
  updateStripeStatementDescriptor: wrapAsyncErrorHandler(updateStripeStatementDescriptor),
  updateStripePayoutDescriptorPage: wrapAsyncErrorHandler(updateStripePayoutDescriptorPage),
  updateStripePayoutDescriptor: wrapAsyncErrorHandler(updateStripePayoutDescriptor),
  search: wrapAsyncErrorHandler(search),
  searchRequest: wrapAsyncErrorHandler(searchRequest),
  agentInitiatedMotoPage: wrapAsyncErrorHandler(agentInitiatedMotoPage),
  createAgentInitiatedMotoProduct: wrapAsyncErrorHandler(createAgentInitiatedMotoProduct)
}
