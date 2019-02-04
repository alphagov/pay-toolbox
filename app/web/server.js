/**
 * Express HTTP server configuration
 *
 * - this should potentially move from modules into web or config or something
 *   that represents it's group
 */

// @TODO(sfount) @FIXME(sfount) decide between client-session and cookie-session libraries
// - remove the one that isn't used
const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')
const flash = require('connect-flash')
const cookieSession = require('cookie-session')

// @TODO(sfount) cookie-parser may be required
// https://github.com/expressjs/cookie-parser

// @TODO(sfount) investigate this vs. mozilla 'client-sessions' library
// @TODO(sfount) investigate this vs. expressjs 'cookie-session' library

// @TODO(sfount) should the template rendering be moved into a different lib
// and then called through server setup?
const nunjucks = require('nunjucks')

const config = require('./../config')
const logger = require('./../lib/logger')

// @FIXME(sfount) move this out of server configuration
const { toFormattedDate, toFormattedDateLong } = require('./../lib/format')

// stack wide error handlers
const errors = require('./errors')

const router = require('./router')

// @FIXME(sfount) errors should be thrown and this should be properly handled
// if there is no manifest etc.
const staticResourceManifest = require('./../public/manifest')

const app = express()

/**
 * Body Parsing @TODO(sfount) move to seperate file
 */
app.use(bodyParser.urlencoded({ extended: false }))

// allow parsing JSON
app.use(bodyParser.json({ strict: true, limit: '15kb' }))

/**
 * Flash messages - this can be removed if error reporting is moved to its own page
 */
app.use(flash())

// this is included after flash and body parsing middleware as they alter the call stack (it should ideally be placed just before routes)
app.use(logger.middleware)

/**
 * Static files @TODO(sfount) move to seperate file
 * - we could even consider offloading this onto the reverse auth proxy
 */

// @TODO(sfount) cache fonts and versioned CSS assets on the client for up to a
// year - this will drastically reduce the number of requests to the server
const temporaryCachingMechanism = { maxage: '1y' }
app.use('/public', express.static(path.join(config.common.TOOLBOX_FILE_ROOT, 'app/public'), temporaryCachingMechanism))
app.use('/assets/fonts', express.static(path.join(config.common.TOOLBOX_FILE_ROOT, 'node_modules/govuk-frontend/assets/fonts'), temporaryCachingMechanism))
app.use('/assets/svg', express.static(path.join(config.common.TOOLBOX_FILE_ROOT, 'app/assets/svg'), temporaryCachingMechanism))

app.use('/favicon.ico', express.static(path.join(config.common.TOOLBOX_FILE_ROOT, 'node_modules/govuk-frontend/assets/images/', 'favicon.ico')))
/**
 * Sessions @TODO(sfount) move to seperate file
 * - note sessions may not have to be handled by this application at all
 *   if secure headers are sent between the reverse proxy and this application
 *   it will handle anything to do with the cookie session
 */
// const twentyFourHoursInMilis = 24 * 60 * 60 * 1000
// const sessionConfig = {
//   name: 'pay-toolbox-revised-cookies',
//   cookie: {
//     secure: true,
//     httpOnly: true,
//     maxAge: twentyFourHoursInMilis
//   }
// }
// app.use(cookieSession(sessionConfig))

// @TODO(sfount) note cookie sessions currently used to track progress through create/confirm/error pages
// these should be evaluated when it comes to the reverse proxy process, secure auth headers could be used for this
// @TODO(sfount) perforamnce implications of cookie parsing and serving should be considered
// app.use(cookieSession({
//   cookieName: 'pay-toolbox-revised-cookies',
//   secret: 'secret-cryptographically-secure',
//   duration: '24h',
//   activeDuration: '5m'
// }))
app.use(cookieSession({
  name: 'pay-toolbox-revised-cookies',
  keys: ['secret-cryptographically-secure'],
  maxAge: '24h'
}))

/**
 * HTTP Logging @TODO(sfount) move to seperate file
 */
const httpRequestLoggingFormat = config.common.production ? 'short' : 'dev'
app.use(morgan(httpRequestLoggingFormat, { stream: logger.stream }))

/**
 * Rendering @TODO(sfount) move to seperate file
 */
// @TODO(sfount) should the template rendering be moved into a different lib
// and then called through server setup?
app.set('view engine', 'njk')

const templateRendererConfig = { autoescape: true, express: app }

if (!config.common.production) {
  templateRendererConfig.watch = true
}

// include both templates from this repository and from govuk frontend
const templatePathRoots = [
  path.join(config.common.TOOLBOX_FILE_ROOT, 'node_modules/govuk-frontend'),
  'app/web/components'
]

// nunjucks.configure(templatePathRoots, templateRendererConfig)
const templaterEnvironment = nunjucks.configure(templatePathRoots, templateRendererConfig)

// make static manifest details available to all templates
templaterEnvironment.addGlobal('manifest', staticResourceManifest)

templaterEnvironment.addFilter('formatDate', (date) => {
  return toFormattedDate(new Date(date))
})

templaterEnvironment.addFilter('formatDateLong', (date) => {
  return toFormattedDateLong(new Date(date))
})

/**
 * Routing @TODO(sfount) consider if this should be a seperate file
 */
// @TODO(sfount) router could be used to seperate legacy and revised toolbox
// for example
// / - current revised toolbox
// /legacy/ - legacy toolbox (views directly translated)
app.use('/', router)

// @FIXME(sfount) squash these down so one error handler is fired and then it's parsed by everyone that wants it
app.use(errors.handleRequestErrors)
app.use(errors.handleDefault)

module.exports = app
