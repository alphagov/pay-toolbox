const logger = require('./../../../lib/logger')

const { Connector, AdminUsers, PublicAuth } = require('./../../../lib/pay-request')
const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

const GatewayAccount = require('./gatewayAccount.model')

const overview = async function overview (req, res, next) {
  const { accounts } = await Connector.accounts()
  res.render('gateway_accounts/overview', { accounts: accounts, messages: req.flash('info') })
}

const create = async function create (req, res, next) {
  const context = { messages: req.flash('error') }

  if (req.session.recovered) {
    context.recovered = Object.assign({}, req.session.recovered)
    delete req.session.recovered
  }
  res.render('gateway_accounts/create', context)
}

const confirm = async function confirm (req, res, next) {
  const accountDetails = new GatewayAccount(req.body)
  res.render('gateway_accounts/confirm', { accountDetails })
}

const writeAccount = async function writeAccount (req, res, next) {
  const account = new GatewayAccount(req.body)
  const response = await Connector.createAccount(account.formatPayload())

  req.flash('info', `Gateway account ${response.gateway_account_id} generated`)
  res.redirect('/gateway_accounts')
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
