/**
 * Sensible defaults for different logging transports based on environments
 * set through config
 *
 * Note: all output is send to standard out, this is picked up by Docker and
 * send through to Sumo logs
 */
const { createLogger, format, transports } = require('winston')

const config = require('./../config')

const logger = createLogger()

// production standard out logs
if (config.common.production) {
  const productionTransport = new transports.Console({
    level: 'info'
  })

  logger.add(productionTransport)
}

// coloursise and timestamp developer logs as these will probably be viewed
// in a simple console (vs. in an already timestamped web viewer)
if (!config.common.production) {
  const developmentTransport = new transports.Console({
    level: 'debug',
    format: format.combine(
      format.colorize(),
      format.timestamp({ format: 'HH:mm:ss' }),
      format.printf(log => `${log.timestamp} ${log.level}: ${log.message}`)
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

module.exports = logger
