const path = require('path')
const fs = require('fs')
const express = require('express')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const cookieSession = require('cookie-session')
const nunjucks = require('nunjucks')
const csurf = require('csurf')
const Sentry = require('@sentry/node')

const {
  common,
  server,
  sentry: sentryConfig,
  disableAuth
} = require('./../config')
const logger = require('./../lib/logger')
const requestLoggingMiddleware = require('../lib/requestLoggingMiddleware')
const passport = require('../lib/auth/passport')

const errors = require('./errorHandler')
const router = require('./router')

// @FIXME(sfount) move this out of server configuration
const {
  toSimpleDate,
  toFormattedDate,
  toFormattedDateLocalTimeZone,
  toFormattedDateLong,
  toCurrencyString,
  toUnixDate,
  toFormattedDateSince
} = require('./../lib/format')

const app = express()

const configureSecureHeaders = function configureSecureHeaders(instance) {
  const serverBehindProxy = server.HTTP_PROXY

  // only set certain proxy configured headers if not behind a proxy
  instance.use(helmet({
    noSniff: !serverBehindProxy,
    frameguard: !serverBehindProxy,
    hsts: !serverBehindProxy,
    xssFilter: !serverBehindProxy
  }))
  // instance.use(helmet.contentSecurityPolicy({
  //   directives: {
  //     defaultSrc: [ '\'self\'' ],
  //     imgSrc: [ '*.githubusercontent.com', '\'self\'', 'data:' ],
  //     styleSrc: [ '\'self\'', '\'unsafe-inline\'' ],
  //     scriptSrc: [
  //       '\'self\'',
  //       '\'sha256-tqCUU2yHjDH9fiULK1QKKUFdNg//3tfcIB2bl/5yKI4=\'',
  //       '\'sha256-sp5LdEiLVbj3Hkr0Dt8A+3UiObargJ/ZVXodsnowmqg=\'',
  //       '\'sha256-SHuobqtLsz+BkKUf/96voBWs07uHoGYGkSPNAUGB3zI=\'',
  //       '\'sha256-WECXrfIM4qswqRtVMthU0BWdq4guuxZbOXZvmtMTUV8=\''
  //     ]
  //   }
  // }))

  instance.use(csurf())
}

const configureRequestParsing = function configureRequestParsing(instance) {
  if (!common.development) {
    // service is behind a front-facing proxy - set req IP values accordinglyi
    instance.enable('trust proxy')
  }

  instance.use(bodyParser.urlencoded({ extended: false }))
  instance.use(bodyParser.json({ strict: true, limit: '15kb' }))
  instance.use(flash())
}

const configureServingPublicStaticFiles = function configureServingPublicStaticFiles(instance) {
  const cache = { maxage: '1y' }
  instance.use('/public', express.static(path.join(__dirname, '../public'), cache))
  instance.use('/assets/fonts', express.static(path.join(process.cwd(), 'node_modules/govuk-frontend/govuk/assets/fonts'), cache))
  instance.use('/scripts/govuk-frontend.js', express.static(path.join(process.cwd(), 'node_modules/govuk-frontend/govuk/all.js'), cache))
  instance.use('/images/favicon.ico', express.static(path.join(process.cwd(), 'node_modules/govuk-frontend/govuk/assets/images/', 'favicon.ico'), cache))
}

const configureClientSessions = function configureClientSessions(instance) {
  instance.use(cookieSession({
    name: 'tbx-session',
    keys: [ server.COOKIE_SESSION_ENCRYPTION_SECRET ],
    maxAge: 24 * 60 * 60 * 1000
  }))
}

const configureAuth = function configureAuth(instance) {
  const exposeAuthenticatedUserToTemplate = (req, res, next) => {
    res.locals.user = req.user
    res.locals.disableAuth = disableAuth
    next()
  }

  instance.use(passport.initialize())
  instance.use(passport.session())
  instance.use(exposeAuthenticatedUserToTemplate)
}

const configureTemplateRendering = async function configureTemplateRendering(instance) {
  const staticResourceManifest = await readManifest('manifest')
  const browserManifest = await readManifest('browser.manifest')

  const templateRendererConfig = { autoescape: true, express: instance, watch: common.development }

  // include both templates from this repository and from govuk frontend
  const templatePathRoots = [ path.join(process.cwd(), 'node_modules/govuk-frontend'), path.join(__dirname, 'modules') ]
  const templaterEnvironment = nunjucks.configure(templatePathRoots, templateRendererConfig)

  // make static manifest details available to all templates
  templaterEnvironment.addGlobal('manifest', { ...staticResourceManifest, ...browserManifest })
  templaterEnvironment.addFilter('formatDate', (date) => toFormattedDate(new Date(date)))
  templaterEnvironment.addFilter('formatToSimpleDate', (date) => toSimpleDate(date))
  templaterEnvironment.addFilter('formatDateLocalTimeZone', (date) => toFormattedDateLocalTimeZone(new Date(date)))
  templaterEnvironment.addFilter('formatDateLong', (date) => toFormattedDateLong(new Date(date)))
  templaterEnvironment.addFilter('formatDateSince', (date) => toFormattedDateSince(new Date(date)))
  templaterEnvironment.addFilter('unixDate', (timestamp) => toUnixDate(timestamp))
  templaterEnvironment.addFilter('currency', (currencyInPence) => toCurrencyString(currencyInPence / 100))
  templaterEnvironment.addFilter('isObject', (value) => typeof value === 'object')

  instance.set('view engine', 'njk')
}

const configureRouting = function configureRouting(instance) {
  // logger middleware included after flash and body parsing middleware as they
  // alter the call stack (it should ideally be placed just before routes)
  instance.use(logger.middleware)
  instance.use(requestLoggingMiddleware())

  instance.use('/', router)
  instance.use(errors.handleNotFound)
}

// top level service stack wide error handling
const configureErrorHandling = function configureErrorHandling(instance) {
  instance.use(errors.handleRequestErrors)
  instance.use(errors.handleDefault)
}

const configureSentry = function configureSentry() {
  Sentry.init({
    dsn: sentryConfig.SENTRY_DSN,
    environment: common.ENVIRONMENT,
      beforeSend(event) {
        if (event.request) {
          delete event.request // This can include sensitive data such as card numbers
        }
          return event
      }
  })
}

const configureSentryRequestHandler = function configureSentryRequestHandler(instance) {
  instance.use(Sentry.Handlers.requestHandler())
}

const configureSentryErrorHandler = function configureSentryErrorHandler(instance) {
  instance.use(Sentry.Handlers.errorHandler())
}

const readManifest = function readManifest(name) {
  return new Promise((resolve) => {
    const file = `${name}.json`
    fs.readFile(path.join(__dirname, '..//public', file), (err, data) => {
      if (err) {
        resolve({})
        return
      }
      try {
        const parsed = JSON.parse(data)
        resolve(parsed)
      } catch (error) {
        logger.warn('Failed to parse manifest', { path })
        resolve({})
      }
    })
  })
}

// order of configuration options important given the nature of Express Middleware
const configure = [
  configureSentry,
  configureSentryRequestHandler,
  configureRequestParsing,
  configureClientSessions,
  configureAuth,
  configureSecureHeaders,
  configureServingPublicStaticFiles,
  configureTemplateRendering,
  configureRouting,
  configureSentryErrorHandler,
  configureErrorHandling
]
configure.map((config) => config(app))

module.exports = app
