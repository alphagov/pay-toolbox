const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const flash = require('connect-flash')
const cookieSession = require('cookie-session')
const nunjucks = require('nunjucks')
const { common } = require('./../config')
const logger = require('./../lib/logger')

const errors = require('./errors')
const router = require('./router')

// @FIXME(sfount) move this out of server configuration
const { toFormattedDate, toFormattedDateLong } = require('./../lib/format')

// @FIXME(sfount) errors should be thrown and this should be properly handled if
//                there is no manifest etc.
// eslint-disable-next-line import/no-unresolved
const staticResourceManifest = require('./../public/manifest')

const app = express()

const configureRequestParsing = function configureRequestParsing(instance) {
  const httpRequestLoggingFormat = common.production ? 'short' : 'dev'

  if (common.production) {
    // service is behind a front-facing proxy - set req IP values accordinglyi
    instance.enable('trust proxy')
  }

  instance.use(bodyParser.urlencoded({ extended: false }))
  instance.use(bodyParser.json({ strict: true, limit: '15kb' }))
  instance.use(flash())

  // logger middleware included after flash and body parsing middleware as they
  // alter the call stack (it should ideally be placed just before routes)
  instance.use(logger.middleware)
  instance.use(morgan(httpRequestLoggingFormat, { stream: logger.stream }))
}

const configureServingPublicStaticFiles = function configureServingPublicStaticFiles(instance) {
  const cache = { maxage: '1y' }
  instance.use('/public', express.static(path.join(common.BUILD_FOLDER_ROOT, 'public'), cache))
  instance.use('/assets/fonts', express.static(path.join(common.TOOLBOX_FILE_ROOT, 'node_modules/govuk-frontend/assets/fonts'), cache))
  instance.use('/favicon.ico', express.static(path.join(common.TOOLBOX_FILE_ROOT, 'node_modules/govuk-frontend/assets/images/', 'favicon.ico')))
}

const configureClientSessions = function configureClientSessions(instance) {
  instance.use(cookieSession({
    name: 'pay-toolbox-service-cookies',
    keys: [ 'secret-cryptographically-secure' ],
    maxAge: '24h'
  }))
}

const configureTemplateRendering = function configureTemplateRendering(instance) {
  const templateRendererConfig = { autoescape: true, express: instance, watch: !common.production }

  // include both templates from this repository and from govuk frontend
  const templatePathRoots = [ path.join(common.TOOLBOX_FILE_ROOT, 'node_modules/govuk-frontend'), path.join(common.BUILD_FOLDER_ROOT, 'web/modules') ]
  const templaterEnvironment = nunjucks.configure(templatePathRoots, templateRendererConfig)

  // make static manifest details available to all templates
  templaterEnvironment.addGlobal('manifest', staticResourceManifest)
  templaterEnvironment.addFilter('formatDate', date => toFormattedDate(new Date(date)))
  templaterEnvironment.addFilter('formatDateLong', date => toFormattedDateLong(new Date(date)))

  instance.set('view engine', 'njk')
}

const configureRouting = function configureRouting(instance) { instance.use('/', router) }

// top level service stack wide error handling
const configureErrorHandling = function configureErrorHandling(instance) {
  instance.use(errors.handleRequestErrors)
  instance.use(errors.handleDefault)
}

// order of configuration options important given the nature of Express Middleware
const configure = [
  configureRequestParsing,
  configureServingPublicStaticFiles,
  configureClientSessions,
  configureTemplateRendering,
  configureRouting,
  configureErrorHandling
]
configure.map(config => config(app))

module.exports = app
