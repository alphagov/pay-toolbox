const logger = require('./../../../lib/logger')
const { EntityNotFoundError } = require('./../../../lib/errors')

// @TODO(sfount) potentially hook these together with a utility by convention
// if an exception entry exists include them both in the router file, if one doesn't
// only include the http route
const confirm = function confirm (error, req, res, next) {
  // @TODO(sfount) use error typof ValidationError
  if (error.name === 'ValidationError') {
    // @TODO(sfount) pattern is not scalable
    const preserveQuery = req.body.systemLinkedService ? `?service=${req.body.systemLinkedService}` : ''
    logger.warn(`Create GatewayAccount ${error.message}`)
    req.session.recovered = req.body
    req.flash('error', error.message)
    res.redirect(`/gateway_accounts/create${preserveQuery}`)
    return
  }
  next(error)
}

const create = function create (error, req, res, next) {
  if (error.name === 'RESTClientError' && error.data.response && error.data.response.status === 404) {
    throw new EntityNotFoundError('Service', req.query.service)
  }
}

const writeAccount = function writeAccount (error, req, res, next) {
  const preserveQuery = req.body.systemLinkedService ? `?service=${req.body.systemLinkedService}` : ''
  req.session.recovered = req.body
  logger.error(`Create GatewayAccount ${error.message}`)
  req.flash('error', error.message)
  res.redirect(`/gateway_accounts/create${preserveQuery}`)
}

const detail = function detail (error, req, res, next) {
  // @TODO(sfount) utility for detecting 404
  if (error.name === 'RESTClientError' && error.data.response && error.data.response.status === 404) {
    throw new EntityNotFoundError('Gateway Account', req.params.id)
  }
  next(error)
}

module.exports = { confirm, writeAccount, detail, create }
