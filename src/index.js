const http = require('http')
const process = require('process')

const { server } = require('./config')
const logger = require('./lib/logger')
const app = require('./web/server')

const logHTTPServerStarted = function logHTTPServerStarted() {
  const context = { node_version: process.version, port: server.PORT, excludeFromBreadcrumb: true }
  logger.info(`Toolbox HTTP server listening on ${server.BIND_HOST}:${server.PORT}`, context)
}

http.createServer(app).listen(server.PORT, server.BIND_HOST, logHTTPServerStarted)
