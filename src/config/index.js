 
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') require('dotenv').config()

const server = require('./server')
const logger = require('./logger')
const common = require('./common')
const services = require('./services')
const sentry = require('./sentry.js')
const auth = require('./auth')
const aws = require('./aws')

// allow requests through IFF node environment is set to development and the environment
// has been explitly set to not enable OAUTH
const disableAuth = common.development && !auth.AUTH_GITHUB_ENABLED

module.exports = {
  disableAuth,
  server,
  common,
  logger,
  services,
  sentry,
  auth,
  aws
}
