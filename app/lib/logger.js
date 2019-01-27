/**
 * Sensible defaults for different logging transports based on environments
 * set through config
 *
 * Note: all output is send to standard out, this is picked up by Docker and
 * send through to Sumo logs
 */
const crypto = require('crypto')
const { createLogger, format, transports } = require('winston')
const { combine, timestamp, printf } = format

// @FIXME(sfount) performance implications of cls-hooked and using the async-hooks node libraries should be very carefully considered
//                continuation-local storage is basically the equivalent of Java thread storage, expires after all methods in a call have ended
const { createNamespace } = require('cls-hooked')

const config = require('./../config')

const session = createNamespace('govuk-pay-logging')
const middleware = function loggerMiddleware (req, res, next) {
  session.run(() => {
    // @TODO(sfount) currently generating a toolbox specific ID - this could be superseeded by correlation ID
    // @TODO(sfount) haven't fully proved that these aren't stored forever and blow up thread memory
    session.set('toolboxid', crypto.randomBytes(4).toString('hex'))
    next()
  })
}

const logger = createLogger()

if (config.common.production) {
  const productionTransport = new transports.Console({
    level: 'info'
  })
  logger.add(productionTransport)
}

const payFormat = printf(log => {
  const id = session.get('toolboxid')
  const estimateSessionSize = JSON.stringify(session).length

  return `${log.timestamp} [${id || '(none)'}] (Session size: ${estimateSessionSize}) ${log.level}: ${log.message}`
})

// coloursise and timestamp developer logs as these will probably be viewed
// in a simple console (vs. in an already timestamped web viewer)
if (!config.common.production) {
  const developmentTransport = new transports.Console({
    level: 'debug',
    format: combine(
      format.colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      payFormat
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
