// @NOTE(sfount) - CSV doesn't seem to work on the current toolbox, it might work
// in production but I haven't seen this. Exporting entities as CSV/ JSON might
// be useful for people needing to share details on production accounts
// the route that would be for services CSV is services/csv
const logger = require('./../../../lib/logger')
const payapi = require('./../../../lib/pay-request')

// @FIXME(sfount) can anything that just passes errors onto next not explicitly create a try block?
const overview = async function overview (req, res, next) {
  try {
    const services = await payapi.service('ADMINUSERS', '/v1/api/services/list')
    console.log('got services', services)
    res.render('services/overview', { services })
  } catch (error) {
    // @TODO(sfount) all top level pages should handle services not being available
    // @TODO(sfount) generic page letting users know that this service cannot be accessed
    // @TODO(sfount) handled in middleware - ECONNRESET (just renders a different page?)
    if (error.code === 'ECONNRESET') {
      res.status(503).send('(503) Admin Users API is unavailable')
    }
    next(error)
  }
}

const detail = async function detail (req, res, next) {
  const id = req.params.id

  try {
    const service = await payapi.service('ADMINUSERS', `/v1/api/services/${id}`)
    const users = await payapi.service('ADMINUSERS', `/v1/api/services/${id}/users`)
    res.render('services/detail', { service, users, serviceId: id, messages: req.flash('info') })
  } catch (error) {
    next(error)
  }
}

// @FIXME(sfount) note this basically duplicates details route
const branding = async function branding (req, res, next) {
  const serviceId = req.params.id
  try {
    const service = await payapi.service('ADMINUSERS', `/v1/api/services/${serviceId}`)
    res.render('services/branding', { serviceId, service })
  } catch (error) {
    next(error)
  }
}

const updateBranding = async function updateBranding (req, res, next) {
  const id = req.params.id

  const payload = {
    op: 'replace',
    path: 'custom_branding',
    value: { image_url: req.body.image_url, css_url: req.body.css_url }
  }

  try {
    // use patch
    const response = await payapi.servicePost('ADMINUSERS', `/v1/api/services/${id}`, payload, true)
    req.flash('info', `Service ${id} branding successfully replaced`)
    res.redirect(`/services/${id}`)
  } catch (error) {
    next(error)
  }
}

const linkAccounts = async function linkAccounts (req, res, next) {
  const serviceId = req.params.id
  res.render('services/link_accounts', { serviceId })
}

// @FIXME(sfount) //@TODO(sfount) handle error through req.flash() and recover values - generic 500 is a bad user experience
const updateLinkAccounts = async function updateLinkAccounts (req, res, next) {
  const id = req.params.id
  const newGatewayId = Number(req.body.account_id)

  try {
    // ensure new id is a single integer
    // this also checks if gate way id is defined
    if (newGatewayId !== parseInt(newGatewayId, 10)) {
      throw new Error(`Provided ID is not a valid integer: ${req.body.account_id}`)
    }

    const payload = {
      op: 'add',
      path: 'gateway_account_ids',
      value: [ newGatewayId.toString() ]
    }
    const response = await payapi.servicePost('ADMINUSERS', `/v1/api/services/${id}`, payload, true)

    req.flash('info', `Service ${id} added gateway account: ${newGatewayId}`)
    res.redirect(`/services/${id}`)
  } catch (error) {
    if (error.response && error.response.status === 409) {
      res.status(409).send(`Server responded with 409 conflict reponse - the gateway id ${newGatewayId} is already linked`)
      return
    }
    next(error)
  }
}

const search = async function search (req, res, next) {
  res.render('services/search', { messages: req.flash('error') })
}

// @TODO(sfount) completely duplicates detail route
const searchRequest = async function searchRequest (req, res, next) {
  const id = req.body.id
  try {
    const service = await payapi.service('ADMINUSERS', `/v1/api/services/${id}`)
    res.redirect(`/services/${service.external_id}`)
  } catch (error) {
    console.log(error)
    if (error.response && error.response.status === 404) {
      req.flash('error', `Service ${id} not found`)
      res.redirect('/services/search')
      return
    }

    next(error)
  }
}

module.exports = { overview, detail, branding, updateBranding, linkAccounts, updateLinkAccounts, search, searchRequest }
