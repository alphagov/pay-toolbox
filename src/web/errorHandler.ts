// handle common service errors thrown by HTTP request handlers
import { Request, Response, NextFunction } from 'express'

import logger from '../lib/logger'
import * as config from '../config'
import {
  EntityNotFoundError, RESTClientError, ValidationError, NotImplementedError
} from '../lib/errors'

interface HttpError extends Error {
  code: string;
}

const handleRequestErrors = function handleRequestErrors(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // generic entity wasn't found - format reponse
  if (error instanceof EntityNotFoundError) {
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

    if (error.data.response && error.data.response.data && error.data.response.data.errors) {
      // take the first data response and present as error
      const message = `${error.service.name}: ${error.data.response.data.errors[0]}`
      res.status(400).render('common/error', { message })
      return
    }
  }

  // generic entity failed to validate fields - format reponse
  if (error instanceof ValidationError) {
    res.status(400).render('common/error', { message: error.message })
    return
  }

  if (error instanceof NotImplementedError) {
    logger.warn(error.message)
    res.status(501).render('common/error', { message: error.message })
    return
  }

  if ((error as HttpError).code === 'EBADCSRFTOKEN') {
    logger.warn('Bad CSRF token received for request')
    res.status(403).render('common/error', { message: `Request forbidden: ${error.message}` })
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
  logger.warn('Unhandled error caught by middleware stack')
  logger.error(error.stack)

  if (res.headersSent) {
    return next(error)
  }
  if (!req.isAuthenticated() && !config.disableAuth) {
    // don't render application structure for non authenticated issues
    return res.redirect('/auth/unauthorised?default_throw')
  }

  const message = config.common.production ? error.message : error.stack
  res.status(500).render('common/error', { message })
}

const handleNotFound = function handleNotFound(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.isAuthenticated()) {
    // do not give specific feedback to any non-authenticated requests
    res.redirect('/')
    return
  }
  // use default express not found exception
  next()
}

export { handleRequestErrors, handleDefault, handleNotFound }
