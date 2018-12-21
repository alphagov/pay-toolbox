const http = require('http')

const logger = require('./lib/logger')
const app = require('./web/server')
const config = require('./config')

// const serverInitEntry = function serverInitEntry () { }

const logHTTPServerStarted = function logHTTPServerStarted () {
  logger.info(`Toolbox HTTP server listening on port ${config.server.port}`)
}

http.createServer(app).listen(config.server.port, logHTTPServerStarted)

console.log('app stub')
