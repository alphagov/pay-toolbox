const http = require('http')

const { server } = require('./config')
const logger = require('./lib/logger')
const app = require('./web/server')
require('./tests/mocks/service_transactions_statistics_mock.js')

/*
Put nock files in separate .js then require them in here
*/

const logHTTPServerStarted = function logHTTPServerStarted() {
  logger.info(`Toolbox HTTP server listening on port ${server.PORT}`)
}

http.createServer(app).listen(server.PORT, logHTTPServerStarted)
