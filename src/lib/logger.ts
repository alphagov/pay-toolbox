// Sensible defaults for different logging transports based on environment
// set through config
// @TODO(sfount) also extract and log the correlation ID sent from the nginx
//               reverse proxy servers in production
// import * as crypto from 'crypto'
import * as crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'
import { createLogger, format, transports } from 'winston'

// @FIXME(sfount) performance implications of cls-hooked and using the async-hooks
//                node libraries should be very carefully considered continuation-local
//                storage is basically the equivalent of Java thread storage, expires
//                after all methods in a call have ended
import { createNamespace } from 'cls-hooked'

import * as config from '../config'

const { combine, timestamp, printf } = format

const logger = createLogger()
const session = createNamespace('govuk-pay-logging')

const loggerMiddleware = function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  session.run(() => {
    session.set('toolboxid', crypto.randomBytes(4).toString('hex'))
    next()
  })
}

if (!config.common.development) {
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
if (config.common.development) {
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
const morganStreamWriter = {
  write: (message: string) => {
    logger.info(message)
  }
}

// Morgan -> Winston stream types aren't well defined - this can be typed strictly when these
// are specified
// eslint-disable-next-line @typescript-eslint/no-explicit-any
logger.stream = morganStreamWriter as any

// @TODO(sfount) attaching object to logger could muddy API in future
Object.assign(logger, { middleware: loggerMiddleware })

// eslint-disable-next-line import/prefer-default-export
export = logger
