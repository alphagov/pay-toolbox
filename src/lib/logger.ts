// Sensible defaults for different logging transports based on environment
// set through config
import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'
import { createLogger, format, transports } from 'winston'
import * as Sentry from '@sentry/node'

// @FIXME(sfount) performance implications of cls-hooked and using the async-hooks
//                node libraries should be very carefully considered continuation-local
//                storage is basically the equivalent of Java thread storage, expires
//                after all methods in a call have ended
import { createNamespace } from 'cls-hooked'

import * as config from '../config'

const { govUkPayLoggingFormat } = require('@govuk-pay/pay-js-commons').logging

const {
  combine,
  timestamp,
  json,
  splat,
  prettyPrint
} = format

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

    Sentry.configureScope((scope) => {
      if (req.headers[correlationHeader]) {
        scope.setTag('correlation_id', req.headers[correlationHeader] as string)
      }
    })
    next()
  })
}

const addSentryBreadcrumb = format((info) => {
  const levelMap: { [key: string]: Sentry.Severity } = {
    'info': Sentry.Severity.Info,
    'warn': Sentry.Severity.Warning,
    'debug': Sentry.Severity.Debug,
    'crit': Sentry.Severity.Critical
  }

  if (!info.excludeFromBreadcrumb) {
    Sentry.configureScope((scope) => {
      scope.addBreadcrumb({
        category: 'log',
        message: info.message,
        level: levelMap[info.level],
        type: 'debug'
      })
    })
  }
  return info
})

const supplementProductionInfo = format((info) => {
  // LOGSTASH 675 versioning https://gds-way.cloudapps.digital/manuals/logging.html
  const productionContext: any = {
    toolbox_id: session.get(TOOLBOX_ID_KEY),
    x_request_id: session.get(CORRELATION_ID_KEY),
    user_id: session.get(AUTHENTICATED_USER_ID_KEY)
  }

  return Object.assign(info, productionContext)
})

if (!config.common.development) {
  const productionTransport = new transports.Console({
    format: combine(
      supplementProductionInfo(),
      addSentryBreadcrumb(),
      splat(),
      prettyPrint(),
      govUkPayLoggingFormat({ container: 'toolbox', environment: config.common.ENVIRONMENT }),
      json()
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

Object.assign(logger, { middleware: loggerMiddleware })

export = logger
