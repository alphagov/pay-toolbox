// handle common service errors thrown by HTTP request handlers
const logger = require('./../lib/logger')
const config = require('./../config')
const { EntityNotFoundError, RESTClientError, ValidationError } = require('./../lib/errors')

const handleRequestErrors = function handleRequestErrors(error, req, res, next) {
  // generic entity wasn't found - format reponse
  if (error.name === EntityNotFoundError.name) {
    logger.warn(error.message)
    res.status(404).render('common/error', { message: error.message })
    return
  }

  // could not access end point - gracefully show service that we were trying to access
  if (error.name === RESTClientError.name) {
    if (error.data.code === 'ECONNREFUSED' || error.data.code === 'ECONNRESET') {
      const message = `${error.service.name} API endpoint is unavailable (${error.data.code})`
      res.status(503).render('common/error', { message })
      return
    }
  }

  // generic entity failed to validate fields - format reponse
  if (error.name === ValidationError.name) {
    res.status(400).render('common/error', { message: error.message })
    return
  }

  next(error)
}

// both custom route handling and application level handling have not categorised
// this error - log the error and return unknown system error to client
const handleDefault = function handleDefault(error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }
  const message = config.common.production ? error.message : error.stack
  logger.error(error.stack)
  res.status(500).render('common/error', { message })
}

module.exports = { handleRequestErrors, handleDefault }
