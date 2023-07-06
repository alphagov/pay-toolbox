/* eslint-disable @typescript-eslint/no-explicit-any */
import {NextFunction, Request, Response} from 'express'
import {stringify} from 'qs'
import moment from 'moment'

import logger from '../../../lib/logger'

import {AdminUsers, Connector, Products, PublicAuth} from '../../../lib/pay-request/client'
import {wrapAsyncErrorHandler} from '../../../lib/routes'
import {extractFiltersFromQuery, toAccountSearchParams} from '../../../lib/gatewayAccounts'

import GatewayAccountFormModel from './gatewayAccount.model'
import {GoLiveStage, Service, UpdateServiceRequest} from '../../../lib/pay-request/services/admin_users/types'
import {Product, ProductType} from '../../../lib/pay-request/services/products/types'
import {
  GatewayAccount,
  StripeCredentials,
  StripeSetup
} from '../../../lib/pay-request/services/connector/types'
import {PaymentProvider} from '../../../lib/pay-request/shared'
import {ClientFormError, formatErrorsForTemplate} from '../common/validationErrorFormat'
import * as config from '../../../config'
import {format} from './csv'
import {formatWithAdminEmails} from './csv_with_admin_emails'
import {createCsvData, createCsvWithAdminEmailsData} from './csv_data'
import CreateAgentInitiatedMotoProductFormRequest from './CreateAgentInitiatedMotoProductFormRequest'
import {EntityNotFoundError, IOValidationError} from '../../../lib/errors'

import * as stripeClient from '../../../lib/stripe/stripe.client'
import {TokenSource, TokenType} from '../../../lib/pay-request/services/public_auth/types'
import {
  updateTicketWithWorldpayGoLiveResponse,
  getTicket,
  updateTicketWithStripeGoLiveResponse
} from "../../../lib/zendesk/zendesk.client";

async function overview(req: Request, res: Response): Promise<void> {
  const filters = extractFiltersFromQuery(req.query)
  const searchParams = toAccountSearchParams(filters)

  const {accounts} = await Connector.accounts.list(searchParams)

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
  const serviceId = req.query.service as string
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

  const {recovered} = req.session
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
    const service = await AdminUsers.services.retrieve(serviceId)
    context.service = service
  }
  res.render('gateway_accounts/create', context)
}

async function confirm(req: Request, res: Response): Promise<void> {
  const account = new GatewayAccountFormModel(req.body)
  res.render('gateway_accounts/confirm', {account, request: req.body, csrf: req.csrfToken()})
}

function getGoLiveUrlForServiceUsingWorldpay(serviceId: string) {
  return `${config.services.SELFSERVICE_URL}/service/${serviceId}/dashboard/live`
}

function getGoLiveUrlForServiceUsingStripe(gatewayAccountExternalId: string) {
  return `${config.services.SELFSERVICE_URL}/account/${gatewayAccountExternalId}/dashboard`
}

async function writeAccount(req: Request, res: Response): Promise<void> {
  const account = new GatewayAccountFormModel(req.body)

  let ticket;
  if (req.body.zendeskTicketNumber) {
    ticket = await getTicket(req.body.zendeskTicketNumber)
  }

  const serviceId = req.body.systemLinkedService
  account.serviceId = serviceId

  const createdAccount = await Connector.accounts.create(account.formatPayload())
  const gatewayAccountIdDerived = String(createdAccount.gateway_account_id)

  logger.info(`Created new Gateway Account ${gatewayAccountIdDerived}`)

  // connect system linked services to the created account
  if (serviceId) {
    const service = await AdminUsers.services.retrieve(serviceId)
    const isUpdateServiceToLive = account.isLive() && service.current_go_live_stage !== 'LIVE'
    const serviceUpdateRequest: UpdateServiceRequest = {
      gateway_account_ids: [gatewayAccountIdDerived],
      internal: account.internalFlag,
      sector: account.sector
    }
    if (isUpdateServiceToLive) {
      serviceUpdateRequest.current_go_live_stage = GoLiveStage.Live
      serviceUpdateRequest.went_live_date = moment.utc().format()
    }
    await AdminUsers.services.update(serviceId, serviceUpdateRequest)
    logger.info(`Service ${serviceId} linked to new Gateway Account ${gatewayAccountIdDerived}`)

    logger.info('Service made live', {
      service_name: service.service_name.en,
      organisation_name: service.merchant_details && service.merchant_details.name,
      sector: account.sector,
      service_went_live_date: moment.utc().format(),
      service_created_date: moment.utc(service.created_date).format(),
      service_using_provider: account.provider,
      service_is_internal_service: account.internalFlag
    })
  }

  const stripeAccountStatementDescriptors: {
    payoutStatementDescriptor?: string,
    statementDescriptor?: string
  } = {}

  if (account.provider === PaymentProvider.Stripe) {
    const stripeAccountDetails = await stripeClient.getStripeApi().accounts.retrieve(account.credentials)
    stripeAccountStatementDescriptors.payoutStatementDescriptor = stripeAccountDetails.settings.payouts.statement_descriptor
    stripeAccountStatementDescriptors.statementDescriptor = stripeAccountDetails.settings.payments.statement_descriptor
  }

  let zendeskTicketUpdated = false
  if (account.provider === PaymentProvider.Worldpay && ticket) {
    zendeskTicketUpdated = await updateTicketWithWorldpayGoLiveResponse(ticket, getGoLiveUrlForServiceUsingWorldpay(serviceId));
  } else if (account.provider === PaymentProvider.Stripe && ticket) {
    zendeskTicketUpdated = await updateTicketWithStripeGoLiveResponse(ticket, getGoLiveUrlForServiceUsingStripe(createdAccount.external_id),
      stripeAccountStatementDescriptors.statementDescriptor, stripeAccountStatementDescriptors.payoutStatementDescriptor);
  }

  // note payment_provider is not returned in the object returned from createAccount
  res.render('gateway_accounts/createSuccess', {
    account: createdAccount,
    linkedService: serviceId,
    gatewayAccountIdDerived,
    provider: account.provider,
    isLive: account.isLive(),
    isStripe: account.provider === 'stripe',
    zendeskTicketUpdated: zendeskTicketUpdated,
    stripeAccountStatementDescriptors,
    selfServiceBaseUrl: config.services.SELFSERVICE_URL
  })
}

async function detail(req: Request, res: Response): Promise<void> {

  let stripeDashboardUri = ''

  const {id} = req.params
  let services = {}
  const isDirectDebitID = id.match(/^DIRECT_DEBIT:/)

  let account, acceptedCards, stripeSetup: StripeSetup
  if (isDirectDebitID) {
    throw new Error(`Direct debit accounts are no longer supported`)
  } else {
    [account, acceptedCards, stripeSetup] = await Promise.all([Connector.accounts.retrieve(id), Connector.accounts.listCardTypes(id), Connector.accounts.retrieveStripeSetup(id)])
  }

  try {
    services = await AdminUsers.services.retrieve({gatewayAccountId: id})
  } catch (error) {
    logger.warn(`Services request for gateway account ${id} returned "${error.message}"`)
  }

  const currentCredential = getCurrentCredential(account)

  const outstandingStripeSetupTasks = Object.keys(stripeSetup)
    .filter(task => task != 'organisation_details' && stripeSetup[task] === false)
    .map(task => task.replace(/_/g, " "))

  if (currentCredential && currentCredential.payment_provider === PaymentProvider.Stripe) {
    const stripeCredentials = currentCredential.credentials as StripeCredentials
    stripeDashboardUri = `https://dashboard.stripe.com/${account.live ? '' : 'test/'}connect/accounts/${stripeCredentials.stripe_account_id}`
  }

  const is3DSFlexApplicable = (currentCredential.payment_provider === PaymentProvider.Worldpay && !account.allow_moto)
  const threeDSFlexEnabled = (account.integration_version_3ds === 2)

  res.render('gateway_accounts/detail', {
    account,
    acceptedCards,
    gatewayAccountId: id,
    services,
    currentCredential,
    outstandingStripeSetupTasks,
    stripeDashboardUri,
    is3DSFlexApplicable,
    threeDSFlexEnabled,
    messages: req.flash('info'),
    csrf: req.csrfToken()
  })
}

function getCurrentCredential(account: GatewayAccount) {
  const credentials = account.gateway_account_credentials || []
  return credentials.find(credential => credential.state === 'ACTIVE') || credentials[0]
}

async function apiKeys(req: Request, res: Response): Promise<void> {
  const gatewayAccountId = req.params.id

  const account = await getAccount(gatewayAccountId)
  const tokensResponse = await PublicAuth.tokens.list({gateway_account_id: gatewayAccountId})
  res.render('gateway_accounts/api_keys', {
    account,
    tokens: tokensResponse.tokens,
    gatewayAccountId,
    messages: req.flash('info')
  })
}

async function deleteApiKey(req: Request, res: Response): Promise<void> {
  const {accountId, tokenId} = req.params

  await PublicAuth.tokens.delete({gateway_account_id: accountId, token_link: tokenId})
  logger.info(`Deleted API Token with token_link ${tokenId} for Gateway Account ${accountId}`)

  req.flash('info', `Token ${tokenId} successfully deleted`)
  res.redirect(`/gateway_accounts/${accountId}/api_keys`)
}

async function getAccount(id: string): Promise<any> {
  const isDirectDebitID = id.match(/^DIRECT_DEBIT:/)
  if (isDirectDebitID) {
    throw new Error(`Direct debit accounts are no longer supported`)
  }
  return Connector.accounts.retrieve(id)
}

async function surcharge(req: Request, res: Response): Promise<void> {
  let service
  const {id} = req.params
  const account = await getAccount(id)

  try {
    service = await AdminUsers.services.retrieve({gatewayAccountId: id})
  } catch (error) {
    logger.warn(`Services request for gateway account ${id} returned "${error.message}"`)
  }

  res.render('gateway_accounts/surcharge', {account, service, csrf: req.csrfToken()})
}

async function updateSurcharge(req: Request, res: Response): Promise<void> {
  const {id} = req.params
  const {
    corporate_credit_card_surcharge_amount,
    corporate_debit_card_surcharge_amount,
    corporate_prepaid_debit_card_surcharge_amount
  } = req.body

  await Connector.accounts.update(id, {corporate_credit_card_surcharge_amount: Number(corporate_credit_card_surcharge_amount)})
  await Connector.accounts.update(id, {corporate_debit_card_surcharge_amount: Number(corporate_debit_card_surcharge_amount)})
  await Connector.accounts.update(id, {corporate_prepaid_debit_card_surcharge_amount: Number(corporate_prepaid_debit_card_surcharge_amount)})
  req.flash('info', 'Corporate surcharge values updated')
  res.redirect(`/gateway_accounts/${id}`)
}

async function emailBranding(req: Request, res: Response): Promise<void> {
  const {id} = req.params
  const account = await getAccount(id)

  res.render('gateway_accounts/email_branding', {account, csrf: req.csrfToken()})
}

async function updateEmailBranding(req: Request, res: Response):
  Promise<void> {
  const {id} = req.params
  const {api_token, template_id, refund_issued_template_id, email_reply_to_id} = req.body

  if (email_reply_to_id && email_reply_to_id.includes('@')) {
    throw new Error('Reply-to email address ID must be an ID or left blank (not an email address)')
  }

  const notifySettings = {
    api_token,
    template_id,
    refund_issued_template_id,
    ...email_reply_to_id && {email_reply_to_id}
  }

  await Connector.accounts.update(id, {notify_settings: notifySettings})
  req.flash('info', 'Email custom branding successfully updated')
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleBlockPrepaidCards(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const account = await Connector.accounts.retrieve(id)
  const block = !account.block_prepaid_cards
  await Connector.accounts.update(id, {block_prepaid_cards: block})

  req.flash('info', `Prepaid cards are ${block ? 'blocked' : 'allowed'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleMotoPayments(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const account = await Connector.accounts.retrieve(id)
  const enable = !account.allow_moto
  await Connector.accounts.update(id, {allow_moto: enable})

  req.flash('info', `MOTO payments ${enable ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleWorldpayExemptionEngine(req: Request, res: Response): Promise<void> {
  const {id} = req.params
  const account = await Connector.accounts.retrieve(id)
  const enable = !(account.worldpay_3ds_flex && account.worldpay_3ds_flex.exemption_engine_enabled)
  await Connector.accounts.update(id, {worldpay_exemption_engine_enabled: enable})
  req.flash('info', `Worldpay Exception Engine ${enable ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleAllowTelephonePaymentNotifications(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const account = await Connector.accounts.retrieve(id)
  const enable = !account.allow_telephone_payment_notifications
  await Connector.accounts.update(id, {allow_telephone_payment_notifications: enable})

  req.flash('info', `Telephone payment notifications ${enable ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleSendPayerIpAddressToGateway(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const account = await Connector.accounts.retrieve(id)
  const enable = !account.send_payer_ip_address_to_gateway
  await Connector.accounts.update(id, {send_payer_ip_address_to_gateway: enable})

  req.flash('info', `Sending payer IP address to gateway ${enable ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleSendPayerEmailToGateway(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const account = await Connector.accounts.retrieve(id)
  const enable = !account.send_payer_email_to_gateway
  await Connector.accounts.update(id, {send_payer_email_to_gateway: enable})

  req.flash('info', `Sending payer email to gateway ${enable ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleSendReferenceToGateway(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const account = await Connector.accounts.retrieve(id)
  const enable = !account.send_reference_to_gateway
  const enabled = await Connector.accounts.update(id, {send_reference_to_gateway: enable})

  req.flash('info', `Sending reference (instead of description) to gateway ${enable ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function disableReasonPage(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const account = await getAccount(id)

  res.render('gateway_accounts/disabled_reason', {account, csrf: req.csrfToken()})
}

async function disable(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const {reason} = req.body
  await Connector.accounts.update(id, {
    disabled: true
  })
  await Connector.accounts.update(id, {
    disabled_reason: reason
  })

  res.redirect(`/gateway_accounts/${id}`)
}

async function enable(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  await Connector.accounts.update(id, {disabled: false})

  req.flash('info', `Gateway account enabled`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleAllowAuthorisationApi(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const account = await Connector.accounts.retrieve(id)
  const enable = !account.allow_authorisation_api
  await Connector.accounts.update(id, {allow_authorisation_api: enable})

  req.flash('info', `Use of the payment authorisation API is ${enable ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function toggleRecurringEnabled(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const account = await Connector.accounts.retrieve(id)
  const enable = !account.recurring_enabled
  await Connector.accounts.update(id, {recurring_enabled: enable})

  req.flash('info', `Recurring card payments ${enable ? 'enabled' : 'disabled'}`)
  res.redirect(`/gateway_accounts/${id}`)
}

async function updateStripeStatementDescriptorPage(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const account = await getAccount(id)

  res.render('gateway_accounts/stripe_statement_descriptor', {account, csrf: req.csrfToken()})
}

async function updateStripePayoutDescriptorPage(
  req: Request,
  res: Response
): Promise<void> {
  const {id} = req.params
  const account = await getAccount(id)
  res.render('gateway_accounts/stripe_payout_descriptor', {account, csrf: req.csrfToken()})
}

async function updateStripeStatementDescriptor(
  req: Request,
  res: Response
): Promise<void> {
  const {statement_descriptor} = req.body
  const {id} = req.params
  const {stripe_account_id} = await Connector.accounts.retrieveStripeCredentials(id)

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
  const {statement_descriptor} = req.body
  const {id} = req.params
  const {stripe_account_id} = await Connector.accounts.retrieveStripeCredentials(id)

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
  res.render('gateway_accounts/search', {csrf: req.csrfToken()})
}

async function searchRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  const id = req.body.id.trim()
  try {
    await Connector.accounts.retrieve(id)
    return res.redirect(`/gateway_accounts/${id}`)
  } catch (err) {
    if (err instanceof EntityNotFoundError) {
      try {
        const accountByExternalId = await Connector.accounts.retrieveByExternalId(id)
        return res.redirect(`/gateway_accounts/${accountByExternalId.gateway_account_id}`)
      } catch (err) {
        if (err instanceof EntityNotFoundError) {
          const accountByPaymentProviderAccountId = await Connector.accounts.list({payment_provider_account_id: id})
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
  const {id} = req.params

  const [account, service, products] = await Promise.all([
    getAccount(id),
    AdminUsers.services.retrieve({gatewayAccountId: id}),
    Products.accounts.listProductsByType(id, ProductType.Moto)
  ])

  const context: {
    account: GatewayAccount;
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

  const {recovered} = req.session

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

  const {id: gatewayAccountId} = req.params

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

  const createApiTokenRequest = {
    account_id: gatewayAccountId,
    description: apiTokenDescription,
    created_by: 'govuk-pay-support@digital.cabinet-office.gov.uk',
    token_type: TokenType.Card,
    type: TokenSource.Products,
    token_account_type: account.type
  }

  const {token} = await PublicAuth.tokens.create(createApiTokenRequest)

  logger.info(`Created agent-initiated MOTO API token for gateway account ${gatewayAccountId} with description [${apiTokenDescription}]`)

  const createAgentInitiatedMotoProductRequest = {
    gateway_account_id: gatewayAccountId,
    pay_api_token: token,
    name: formValues.name,
    description: formValues.description,
    reference_enabled: true,
    reference_label: formValues.reference_label,
    reference_hint: formValues.reference_hint,
    type: ProductType.Moto
  }

  const {external_id} = await Products.products.create(createAgentInitiatedMotoProductRequest)

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
  disableReasonPage: wrapAsyncErrorHandler(disableReasonPage),
  disable: wrapAsyncErrorHandler(disable),
  enable: wrapAsyncErrorHandler(enable),
  updateStripeStatementDescriptorPage: wrapAsyncErrorHandler(updateStripeStatementDescriptorPage),
  updateStripeStatementDescriptor: wrapAsyncErrorHandler(updateStripeStatementDescriptor),
  updateStripePayoutDescriptorPage: wrapAsyncErrorHandler(updateStripePayoutDescriptorPage),
  updateStripePayoutDescriptor: wrapAsyncErrorHandler(updateStripePayoutDescriptor),
  search: wrapAsyncErrorHandler(search),
  searchRequest: wrapAsyncErrorHandler(searchRequest),
  agentInitiatedMotoPage: wrapAsyncErrorHandler(agentInitiatedMotoPage),
  createAgentInitiatedMotoProduct: wrapAsyncErrorHandler(createAgentInitiatedMotoProduct),
  toggleWorldpayExemptionEngine: wrapAsyncErrorHandler(toggleWorldpayExemptionEngine),
  toggleAllowAuthorisationApi: wrapAsyncErrorHandler(toggleAllowAuthorisationApi),
  toggleRecurringEnabled: wrapAsyncErrorHandler(toggleRecurringEnabled)
}
