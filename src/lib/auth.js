const passport = require('passport')
const logger = require('./logger')

// Simple method to ensure that all `req` objects passed in have
// sufficient access headers to access secured routes. Any route that specifies
// `secured` will be rejected without these headers.
const secured = function secured(req, res, next) {
  if (req.isAuthenticated()) {
    next()
    return
  }
  logger.info('Unauthenticated request to resource, redirecting to auth')
  res.redirect('/auth')
}

const unauthorised = function unauthorised(req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('/')
    return
  }

  logger.warn('Unauthorised response rendered for unauthenticated session')
  res.status(403).send('User does not have permissions to access the resource')
}

module.exports = { secured, unauthorised }
