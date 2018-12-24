/**
 * Express HTTP server configuration
 *
 * - this should potentially move from modules into web or config or something
 *   that represents it's group
 */
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

const app = express()

/**
 * Body Parsing @TODO(sfount) move to seperate file
 */
// app.use(bodyParser.urlencoded({ extended: false }))

// allow parsing JSON
app.use(bodyParser.json({ strict: true, limit: '15kb' }))

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

nunjucks.configure('app/web/components', templateRendererConfig)

/**
 * Routing @TODO(sfount) consider if this should be a seperate file
 */
// @TODO(sfount) router could be used to seperate legacy and revised toolbox
// for example
// / - current revised toolbox
// /legacy/ - legacy toolbox (views directly translated)
app.use('/', router)

module.exports = app
