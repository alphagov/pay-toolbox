const logger = require('./../../../lib/logger')
const { EntityNotFoundError } = require('./../../../lib/errors')

const confirm = function confirm(error, req, res, next) {
  if (error.name === 'ValidationError') {
    const preserveQuery = buildPreservedQuery(req.body)
    logger.warn(`Create GatewayAccount ${error.message}`)
    req.session.recovered = req.body
    req.flash('error', error.message)
    res.redirect(`/gateway_accounts/create${preserveQuery}`)
    return
  }
  next(error)
}

const create = function create(error, req, res, next) {
  if (error.name === 'RESTClientError' && error.data.response && error.data.response.status === 404) {
    throw new EntityNotFoundError('Service', req.query.service)
  }
  next(error)
}

const writeAccount = function writeAccount(error, req, res, next) {
  const preserveQuery = buildPreservedQuery(req.body)
  req.session.recovered = req.body
  logger.error(`Create GatewayAccount ${error.message}`)
  req.flash('error', error.message)
  res.redirect(`/gateway_accounts/create${preserveQuery}`)
}

const detail = function detail(error, req, res, next) {
  if (error.name === 'RESTClientError' && error.data.response && error.data.response.status === 404) {
    throw new EntityNotFoundError('Gateway Account', req.params.id)
  }
  next(error)
}

// @FIXME(sfount) util to build preserving queries - should be evalutated to scale
const buildPreservedQuery = function buildPreservedQuery(body) {
  const supported = {
    systemLinkedService: 'service',
    systemLinkedCredentials: 'credentials'
  }

  const queryElements = []

  Object.keys(body).forEach((key) => {
    if (Object.keys(supported).includes(key)) {
      queryElements.push(`${supported[key]}=${body[key]}`)
    }
  })

  return queryElements.length ? `?${queryElements.join('&')}` : ''
}

module.exports = {
  confirm, writeAccount, detail, create
}
