import { Request, Response, NextFunction } from 'express'

import logger from '../../../lib/logger'
import {
  EntityNotFoundError,
  RESTClientError,
  ValidationError,
  IOValidationError
} from '../../../lib/errors'
import { formatErrorsForTemplate } from '../common/validationErrorFormat'

// @FIXME(sfount) util to build preserving queries - should be evalutated to scale
const buildPreservedQuery = function buildPreservedQuery(body: { [key: string]: string }): string {
  const supported: { [key: string]: string } = {
    systemLinkedService: 'service',
    systemLinkedCredentials: 'credentials',
    provider: 'provider',
    live: 'live'
  }

  const queryElements: string[] = []

  Object.keys(body).forEach((key) => {
    if (Object.keys(supported).includes(key)) {
      queryElements.push(`${supported[key]}=${body[key]}`)
    }
  })

  return queryElements.length ? `?${queryElements.join('&')}` : ''
}

const confirm = function confirm(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof ValidationError || error instanceof IOValidationError) {
    const preserveQuery = buildPreservedQuery(req.body)

    let errors
    if (error instanceof IOValidationError) {
      errors = formatErrorsForTemplate(error.source)
    } else {
      logger.warn(`Create GatewayAccount ${error.message}`)
      req.flash('error', error.message)
    }

    req.session.recovered = {
      formValues: req.body,
      errors
    }
    res.redirect(`/gateway_accounts/create${preserveQuery}`)
    return
  }
  next(error)
}

const create = function create(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof RESTClientError) {
    if (error.data.response && error.data.response.status === 404) {
      throw new EntityNotFoundError('Service', req.query.service as string)
    }
  }
  next(error)
}

const writeAccount = function writeAccount(
  error: Error,
  req: Request,
  res: Response
): void {
  let errors
  if (error instanceof IOValidationError) {
    errors = formatErrorsForTemplate(error.source)
  } else {
    logger.error(`Create GatewayAccount ${error.message}`)
    req.flash('error', error.message)
  }

  req.session.recovered = {
    formValues: req.body,
    errors
  }
  const preserveQuery = buildPreservedQuery(req.body)
  res.redirect(`/gateway_accounts/create${preserveQuery}`)
}

const detail = function detail(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof RESTClientError) {
    if (error.data.response && error.data.response.status === 404) {
      throw new EntityNotFoundError('Gateway Account', req.params.id)
    }
  }
  next(error)
}

export default {
  confirm, writeAccount, detail, create
}
