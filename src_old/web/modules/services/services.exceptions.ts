import { Request, Response, NextFunction } from 'express'

import logger from '../../../lib/logger'
import { EntityNotFoundError, RESTClientError, ValidationError } from '../../../lib/errors'

const detail = function detail(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof RESTClientError) {
    if (error.data.response && error.data.response.status === 404) {
      throw new EntityNotFoundError('Service', req.params.id)
    }
  }
  next(error)
}

const updateLinkAccounts = function updateLinkAccounts(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (error instanceof ValidationError) {
    // @FIXME(sfount) formalise recovery with recover utility (that timeout destroys objects)
    req.session.recovered = { id: req.body.id }
    logger.warn(`UpdateLinkAccounts ${error.message} (${req.body.id})`)
    req.flash('error', error.message)
    res.redirect(`/services/${req.params.id}/link_accounts`)
    return
  }

  if (error instanceof RESTClientError) {
    if (error.data.response && error.data.response.status === 409) {
      const message = `Gateway account ${req.body.id} is already linked to a service`
      req.session.recovered = { id: req.body.id }
      logger.warn(message)
      req.flash('error', message)
      res.redirect(`/services/${req.params.id}/link_accounts`)
      return
    }
  }
  next(error)
}

export { detail, updateLinkAccounts }
