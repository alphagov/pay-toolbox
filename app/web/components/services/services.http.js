const logger = require('./../../../lib/logger')
const { AdminUsers } = require('./../../../lib/pay-request')
const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

const GatewayAccountRequest = require('./gatewayAccountRequest.model')

const overview = async function overview (req, res, next) {
  const services = await AdminUsers.services()
  res.render('services/overview', { services })
}

const detail = async function detail (req, res, next) {
  const serviceId = req.params.id
  const messages = req.flash('info')

  const service = await AdminUsers.service(serviceId)
  const users = await AdminUsers.serviceUsers(serviceId)
  res.render('services/detail', { service, users, serviceId, messages })
}

const branding = async function branding (req, res, next) {
  const serviceId = req.params.id

  const service = await AdminUsers.service(serviceId)
  res.render('services/branding', { serviceId, service })
}

const updateBranding = async function updateBranding (req, res, next) {
  const id = req.params.id

  await AdminUsers.updateServiceBranding(id, req.body.image_url, req.body.css_url)

  req.flash('info', `Service ${id} branding successfully replaced`)
  res.redirect(`/services/${id}`)
}

const linkAccounts = async function linkAccounts (req, res, next) {
  const serviceId = req.params.id
  const context = { serviceId, messages: req.flash('error') }

  if (req.session.recovered) {
    context.recovered = Object.assign({}, req.session.recovered)
    delete req.session.recovered
  }
  res.render('services/link_accounts', context)
}

const updateLinkAccounts = async function updateLinkAccounts (req, res, next) {
  const serviceId = req.params.id

  const gatewayAccountRequest = new GatewayAccountRequest(req.body.account_id)
  await AdminUsers.updateServiceGatewayAccount(serviceId, gatewayAccountRequest.id)

  logger.info(`Service ${serviceId} added gateway account ${gatewayAccountRequest.id}`)
  req.flash('info', `Gateway Account ${gatewayAccountRequest.id} linked`)
  res.redirect(`/services/${serviceId}`)
}

const search = async function search (req, res, next) {
  const messages = req.flash('error')
  res.render('services/search', { messages })
}

const searchRequest = async function searchRequest (req, res, next) {
  res.redirect(`/services/${req.body.id}`)
}

const handlers = { overview, detail, branding, updateBranding, linkAccounts, updateLinkAccounts, search, searchRequest }
module.exports = wrapAsyncErrorHandlers(handlers)
