/**
 * Express HTTP server configuration
 *
 * - this should potentially move from modules into web or config or something
 *   that represents it's group
 */
const path = require('path')

const express = require('express')
const bodyParser = require('body-parser')
const morgan = require('morgan')

// @TODO(sfount) cookie-parser may be required
// https://github.com/expressjs/cookie-parser

// @TODO(sfount) investigate this vs. mozilla 'client-sessions' library
// @TODO(sfount) investigate this vs. expressjs 'cookie-session' library

// @TODO(sfount) should the template rendering be moved into a different lib
// and then called through server setup?
const nunjucks = require('nunjucks')

const config = require('./../config')
const logger = require('./../lib/logger')

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
 * Static files @TODO(sfount) move to seperate file
 * - we could even consider offloading this onto the reverse auth proxy
 */

// @TODO(sfount) cache fonts and versioned CSS assets on the client for up to a
// year - this will drastically reduce the number of requests to the server
const temporaryCachingMechanism = { maxage: '1y' }
app.use('/public', express.static(path.join(config.common.TOOLBOX_FILE_ROOT, 'app/public'), temporaryCachingMechanism))
app.use('/assets/fonts', express.static(path.join(config.common.TOOLBOX_FILE_ROOT, 'node_modules/govuk-frontend/assets/fonts'), temporaryCachingMechanism))
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

/**
 * Routing @TODO(sfount) consider if this should be a seperate file
 */
// @TODO(sfount) router could be used to seperate legacy and revised toolbox
// for example
// / - current revised toolbox
// /legacy/ - legacy toolbox (views directly translated)
app.use('/', router)

module.exports = app
