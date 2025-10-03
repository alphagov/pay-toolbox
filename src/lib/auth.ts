import logger from './logger'
import {disableAuth} from './../config'
import {NextFunction, Request, Response} from 'express'
import {PermissionLevel} from './auth/types'

export function secured(permissionLevel: PermissionLevel) {
  return function checkUserIsAuthenticatedAndPermitted(req: Request, res: Response, next: NextFunction) {
    if (disableAuth) {
      delete req.session.authBlockedRedirectUrl
      return next()
    }
    if (req.session && req.isAuthenticated()) {
      if (req.user.permissionLevel && req.user.permissionLevel >= permissionLevel) {
        delete req.session.authBlockedRedirectUrl
        return next()
      }
      logger.info(`User ${req.user.username} does not have sufficient permissions to access path`)
      return res.render('common/error', {message: 'You do not have permission to access this resource.'})
    }

    logger.info('Unauthenticated request to resource, redirecting to auth')
    if (req.session) {
      req.session.authBlockedRedirectUrl = req.originalUrl
    }
    res.redirect('/auth')
  }
}

export function unauthorised(req: Request, res: Response) {
  if (req.session && req.isAuthenticated()) {
    res.redirect('/')
    return
  }

  logger.warn('Unauthorised response rendered for unauthenticated session')
  res.status(403).send('User does not have permissions to access the resource')
}

export function revokeSession(req: Request, res: Response) {
  logger.info(`Revoking session for user ${req.user?.username}`)
  req.logout()
  res.redirect('/') 
}
