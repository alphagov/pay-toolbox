const process = require('process')

// localhost https
const https = require('https')
const fs = require('fs')
const privateKey = fs.readFileSync('./localhost-key.pem')
const certificate = fs.readFileSync('./localhost.pem')

const { server } = require('./config')
const logger = require('./lib/logger')
const app = require('./web/server')

const logHTTPServerStarted = function logHTTPServerStarted() {
  const context = { node_version: process.version, port: server.PORT, excludeFromBreadcrumb: true }
  logger.info(`Toolbox HTTPS server listening on ${server.BIND_HOST}:${server.PORT}`, context)
}

https.createServer({ key: privateKey, cert: certificate }, app).listen(server.PORT, server.BIND_HOST, logHTTPServerStarted)
