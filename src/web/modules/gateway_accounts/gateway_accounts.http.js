const logger = require('./../../../lib/logger')

const {
  Connector, DirectDebitConnector, AdminUsers, PublicAuth
} = require('./../../../lib/pay-request')
const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

const GatewayAccount = require('./gatewayAccount.model')

const overview = async function overview(req, res) {
  const { accounts } = await Connector.accounts()
  res.render('gateway_accounts/overview', { accounts, messages: req.flash('info') })
}
const overviewDirectDebit = async function overviewDirectDebit(req, res) {
  const { accounts } = await DirectDebitConnector.accounts()
  res.render('gateway_accounts/overview', { accounts, messages: req.flash('info') })
}

const create = async function create(req, res) {
  const linkedService = req.query.service
  const context = { messages: req.flash('error'), linkedCredentials: req.query.credentials }

  if (req.session.recovered) {
    context.recovered = Object.assign({}, req.session.recovered)
    delete req.session.recovered
  }

  if (linkedService) {
    const service = await AdminUsers.service(linkedService)
    context.service = service
  }
  res.render('gateway_accounts/create', context)
}

const confirm = async function confirm(req, res) {
  const account = new GatewayAccount(req.body)
  res.render('gateway_accounts/confirm', { account, request: req.body })
}

const writeAccount = async function writeAccount(req, res) {
  const jobs = {}
  const account = new GatewayAccount(req.body)
  const linkedService = req.body.systemLinkedService

  const createAccountMethod = account.isDirectDebit
    ? DirectDebitConnector.createAccount
    : Connector.createAccount
  jobs.account = await createAccountMethod(account.formatPayload())

  logger.info(`Created new Gateway Account ${jobs.account.gateway_account_id} with external ID ${jobs.account.gateway_account_external_id}`)

  // derive Gateway account ID. For Direct Debit use `gateway_account_external_id`
  // otherwise `gateway_account_id`
  const gatewayAccountIdDerived = account.isDirectDebit
    ? `${jobs.account.gateway_account_external_id}`
    : `${jobs.account.gateway_account_id}`

  // connect system linked services to the created account
  if (linkedService) {
    jobs.linkService = await AdminUsers.updateServiceGatewayAccount(
      linkedService,
      gatewayAccountIdDerived
    )
    logger.info(`Service ${linkedService} linked to new Gateway Account ${gatewayAccountIdDerived}`)

    jobs.serviceStatus = await AdminUsers.updateServiceGoLiveStatus(linkedService, 'LIVE')
    logger.info(`Service ${linkedService} 'current_go_live_stage' updated to 'LIVE'`)
  }

  // note payment_provider is not returned in the object returned from createAccount
  res.render('gateway_accounts/createSuccess', {
    account: jobs.account, linkedService, gatewayAccountIdDerived, provider: account.provider
  })
}

const detail = async function detail(req, res) {
  const { id } = req.params
  let services = {}
  const isDirectDebitID = id.match(/^DIRECT_DEBIT:/)
  const readAccountMethod = isDirectDebitID ? DirectDebitConnector.account : Connector.account

  const account = await readAccountMethod(id)

  try {
    services = await AdminUsers.gatewayAccountServices(id)
  } catch (error) {
    logger.warn(`Services request for gateway account ${id} returned "${error.message}"`)
  }

  res.render('gateway_accounts/detail', { account, gatewayAccountId: id, services })
}

const apiKeys = async function apiKeys(req, res) {
  const gatewayAccountId = req.params.id
  const tokens = await PublicAuth.apiKeyTokens(gatewayAccountId)
  res.render('gateway_accounts/api_keys', { tokens, gatewayAccountId, messages: req.flash('info') })
}

const deleteApiKey = async function deleteApiKey(req, res) {
  const { accountId, tokenId } = req.params

  await PublicAuth.deleteApiToken(accountId, tokenId)
  logger.info(`Deleted API Token with ID ${tokenId} for Gateway Account ${accountId}`)

  req.flash('info', `Token ${tokenId} successfully deleted`)
  res.redirect(`/gateway_accounts/${accountId}/api_keys`)
}

const handlers = {
  overview, overviewDirectDebit, create, confirm, writeAccount, detail, apiKeys, deleteApiKey
}
module.exports = wrapAsyncErrorHandlers(handlers)
