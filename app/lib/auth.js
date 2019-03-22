const logger = require('./logger')

// Simple method to ensure that all `req` objects passed in have
// sufficient access headers to access secured routes. Any route that specifies
// `secured` will be rejected without these headers.
const secured = function secured(req, res, next) {
  const identityHeader = 'X-OAuth-Header-Secret'
  const oAuthProxyIdentityHeader = req.get(identityHeader)

  if (validateHeaderWithSecrets(oAuthProxyIdentityHeader)) {
    next()
    return
  }

  logger.warn(`Request to ${req.originalUrl} blocked from ${req.ip}`)
  res.status(403).send()
}

const validateHeaderWithSecrets = function validateHeaderWithSecrets(header) {
  // @TODO(sfount) when auth reverse proxy infrastructure is configured specify this behaviour
  return true
}

module.exports = { secured }
