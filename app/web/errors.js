// middleware to handle common errors thrown by HTTP request handlers
const logger = require('./../lib/logger')
const config = require('./../config')
const { EntityNotFoundError, RESTClientError, ValidationError } = require('./../lib/errors')

// - handles REST client requests to other services coming back as ECONREFUSED
// -> simply render an error page saying that a Pay service is required

// const handleRESTClientErrors = function handleRESTClientErrors (error, req, res, next) {
// console.log('errors propegated to middleware', error.message)

// handle case - REST client was refused, attempt to render error view demonstrating which service was required
// if (error.code === 'ECONNRESET' || error.code === 'ECONNREFUSED') {
// @TODO(sfount) - redirect to error page? simply render error page?
// render something nice
// @TODO(sfount) pick out which service it was that through this error by attaching their key when thrown
// res.status(503).send('(503) Admin Users API is unavailable')
// return
// }

// we couldn't find anything to do here
// --> 500 error indiciating that the server broke, doesn't know what to do
// --> in NOT production - send the full stack trace
// next(error)
// }

const handleRequestErrors = function handleRequestErrors (error, req, res, next) {
  if (error.name === EntityNotFoundError.name) {
    logger.warn(error.message)
    res.status(404).render('common/error', { message: error.message })
    return
  }

  // REST errors have already logged from inside pay-request
  if (error.name === RESTClientError.name) {
    if (error.data.code === 'ECONNREFUSED' || error.data.code === 'ECONNRESET') {
      const message = `${error.service.name} API endpoint is unavailable (${error.data.code})`
      res.status(503).render('common/error', { message })
      return
    }
  }

  if (error.name === ValidationError.name) {
    // @TODO(sfount) this is just a guess -- there could be any number of reasons for validation to fail
    res.status(400).render('common/error', { message: error.message })
    return
  }

  next(error)
}

const handleDefault = function handleDefault (error, req, res, next) {
  if (res.headersSent) {
    return next(error)
  }
  const message = config.common.production ? error.message : error.stack
  logger.error(error.stack)
  res.status(500).render('common/error', { message })
}

module.exports = { handleRequestErrors, handleDefault }
