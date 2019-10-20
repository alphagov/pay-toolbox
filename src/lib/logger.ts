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

const { combine, timestamp } = format

const TOOLBOX_ID_KEY = 'toolbox_id'
const CORRELATION_ID_KEY = 'correlation_id'
const AUTHENTICATED_USER_ID_KEY = 'authenticated_user_id'

const logger = createLogger()
const session = createNamespace('govuk-pay-logging')

const loggerMiddleware = function loggerMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  session.run((): void => {
    const correlationHeader = 'x-request-id'
    const toolboxId = crypto.randomBytes(4).toString('hex')
    session.set(TOOLBOX_ID_KEY, toolboxId)
    session.set(CORRELATION_ID_KEY, req.headers[correlationHeader])
    session.set(AUTHENTICATED_USER_ID_KEY, req.user && req.user.username)

    // expose toolbox ID to template for debugging
    res.locals.toolboxId = toolboxId
    next()
  })
}

const supplementProductionInfo = format((info) => {
  // LOGSTASH 675 versioning https://gds-way.cloudapps.digital/manuals/logging.html
  const LOG_VERSION = 1
  const productionContext: any = {
    toolbox_id: session.get(TOOLBOX_ID_KEY),
    correlation_id: session.get(CORRELATION_ID_KEY),
    user_id: session.get(AUTHENTICATED_USER_ID_KEY)
  }
  productionContext['@version'] = LOG_VERSION
  return Object.assign(info, productionContext)
})

if (!config.common.development) {
  const productionTransport = new transports.Console({
    format: combine(
      supplementProductionInfo(),
      timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.sssZ', alias: '@timestamp' }),
      format.json()
    ),
    level: 'info'
  })
  logger.add(productionTransport)
}

// coloursise and timestamp developer logs as these will probably be viewed
// in a simple console (vs. in an already timestamped web viewer)
if (config.common.development) {
  const developmentTransport = new transports.Console({
    level: 'debug',
    format: combine(
      format((info) => Object.assign(info, { toolboxId: session.get(TOOLBOX_ID_KEY) }))(),
      timestamp({ format: 'HH:mm:ss' }),
      format.colorize(),
      format.simple()
    )
  })
  logger.add(developmentTransport)
}

// configure logger specifically for `Morgan` stream
const morganStreamWriter = {
  write: (message: string): void => {
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
