const logger = require('./../../../lib/logger')

const { Connector, DirectDebitConnector, AdminUsers, PublicAuth } = require('./../../../lib/pay-request')
const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

const GatewayAccount = require('./gatewayAccount.model')

const overview = async function overview (req, res, next) {
  const { accounts } = await Connector.accounts()
  res.render('gateway_accounts/overview', { accounts, messages: req.flash('info') })
}

const create = async function create (req, res, next) {
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

const confirm = async function confirm (req, res, next) {
  const account = new GatewayAccount(req.body)
  res.render('gateway_accounts/confirm', { account, request: req.body })
}

const writeAccount = async function writeAccount (req, res, next) {
  const jobs = {}
  const account = new GatewayAccount(req.body)
  const linkedService = req.body.systemLinkedService

  const createAccountMethod = account.isDirectDebit ? DirectDebitConnector.createAccount : Connector.createAccount
  jobs.account = await createAccountMethod(account.formatPayload())

  logger.info(`Created new Gateway Account ${jobs.account.gateway_account_id}`)

  // connect system linked services to the created account
  if (linkedService) {
    jobs.linkService = await AdminUsers.updateServiceGatewayAccount(linkedService, jobs.account.gateway_account_id)
    logger.info(`Service ${linkedService} linked to new Gateway Account ${jobs.account.gateway_account_id}`)

    jobs.serviceStatus = await AdminUsers.updateServiceGoLiveStatus(linkedService, 'LIVE')
    logger.info(`Service ${linkedService} 'current_go_live_stage' updated to 'LIVE'`)
  }

  // note payment_provider is not returned in the object returned from createAccount
  res.render('gateway_accounts/createSuccess', { account: jobs.account, linkedService, provider: account.provider })
}

const detail = async function detail (req, res, next) {
  const id = req.params.id
  let services = {}
  const account = await Connector.account(id)

  try {
    services = await AdminUsers.gatewayAccountServices(id)
  } catch (error) {
    logger.warn(`Services request for gatway account ${id} returned "${error.message}"`)
  }

  res.render('gateway_accounts/detail', { account, services })
}

const apiKeys = async function apiKeys (req, res, next) {
  const gatewayAccountId = req.params.id
  const tokens = await PublicAuth.apiKeyTokens(gatewayAccountId)
  res.render('gateway_accounts/api_keys', { tokens, gatewayAccountId, messages: req.flash('info') })
}

const deleteApiKey = async function deleteApiKey (req, res, next) {
  const { accountId, tokenId } = req.params

  await PublicAuth.deleteApiToken(accountId, tokenId)
  logger.info(`Deleted API Token with ID ${tokenId} for Gateway Account ${accountId}`)

  req.flash('info', `Token ${tokenId} successfully deleted`)
  res.redirect(`/gateway_accounts/${accountId}/api_keys`)
}

const handlers = { overview, create, confirm, writeAccount, detail, apiKeys, deleteApiKey }
module.exports = wrapAsyncErrorHandlers(handlers)
