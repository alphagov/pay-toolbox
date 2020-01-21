import morgan from 'morgan'
import { RequestHandler } from 'express-serve-static-core'
import * as logger from './logger'

const { format } = require('@govuk-pay/pay-js-commons').logging.requestLogFormat('x-request-id')

const logRequest = function logRequest(): RequestHandler {
  return morgan(format, {
    stream: {
      write: (message: string): void => {
        logger.info('Request received', JSON.parse(message))
      }
    }
  })
}

export = logRequest
