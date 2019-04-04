// handle common service errors thrown by HTTP request handlers
import { Request, Response, NextFunction } from 'express'

import * as logger from '../lib/logger'
import * as config from '../config'
import { EntityNotFoundError, RESTClientError, ValidationError } from '../lib/errors'

const handleRequestErrors = function handleRequestErrors(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // generic entity wasn't found - format reponse
  if (error.name === EntityNotFoundError.name) {
    logger.warn(error.message)
    res.status(404).render('common/error', { message: error.message })
    return
  }

  // could not access end point - gracefully show service that we were trying to access
  if (error instanceof RESTClientError) {
    if (error.data.code === 'ECONNREFUSED' || error.data.code === 'ECONNRESET') {
      const message = `${error.service.name} API endpoint is unavailable (${error.data.code})`
      res.status(503).render('common/error', { message })
      return
    }
  }

  // generic entity failed to validate fields - format reponse
  if (error instanceof ValidationError) {
    res.status(400).render('common/error', { message: error.message })
    return
  }

  next(error)
}

// both custom route handling and application level handling have not categorised
// this error - log the error and return unknown system error to client
// allow this method to not return consistently as it is the last method in the stack
// eslint-disable-next-line consistent-return
const handleDefault = function handleDefault(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(error)
  }
  const message = config.common.production ? error.message : error.stack
  logger.error(error.stack)
  res.status(500).render('common/error', { message })
}

export { handleRequestErrors, handleDefault }
