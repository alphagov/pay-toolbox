// Sensible defaults for different logging transports based on environment
// set through config
// @TODO(sfount) also extract and log the correlation ID sent from the nginx reverse proxy servers in production
const crypto = require('crypto')
const { createLogger, format, transports } = require('winston')

const { combine, timestamp, printf } = format

// @FIXME(sfount) performance implications of cls-hooked and using the async-hooks node libraries should be very carefully considered
//                continuation-local storage is basically the equivalent of Java thread storage, expires after all methods in a call have ended
const { createNamespace } = require('cls-hooked')

const { common } = require('./../config')

const logger = createLogger()
const session = createNamespace('govuk-pay-logging')

const middleware = function loggerMiddleware(req, res, next) {
  session.run(() => {
    session.set('toolboxid', crypto.randomBytes(4).toString('hex'))
    next()
  })
}

if (common.production) {
  const productionTransport = new transports.Console({
    level: 'info'
  })
  logger.add(productionTransport)
}

const payLogsFormatter = printf((log) => {
  const id = session.get('toolboxid')
  return `${log.timestamp} [${id || '(none)'}] ${log.level}: ${log.message}`
})

// coloursise and timestamp developer logs as these will probably be viewed
// in a simple console (vs. in an already timestamped web viewer)
if (!common.production) {
  const developmentTransport = new transports.Console({
    level: 'debug',
    format: combine(
      format.colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      payLogsFormatter
    )
  })
  logger.add(developmentTransport)
}

// configure logger specifically for `Morgan` stream
logger.stream = {
  write: (message, encoding) => {
    logger.info(message)
  }
}

// @TODO(sfount) attaching object to logger could muddy API in future
Object.assign(logger, { middleware })
module.exports = logger
