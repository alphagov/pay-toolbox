import logger from './logger'
import {disableAuth} from './../config'
import {NextFunction, Request, Response} from 'express'

// Simple method to ensure that all `req` objects passed in have
// sufficient access headers to access secured routes. Any route that specifies
// `secured` will be rejected without these headers.
export function secured(req: Request, res: Response, next: NextFunction) {
  if ((req.session && req.isAuthenticated()) || disableAuth) {
    delete req.session.authBlockedRedirectUrl
    next()
    return
  }
  logger.info('Unauthenticated request to resource, redirecting to auth')
  if (req.session) {
    req.session.authBlockedRedirectUrl = req.originalUrl
  }
  res.redirect('/auth')
}

/**
 * Require the user to be an admin user to access the route.
 *
 * The admin user restriction should only apply to routes where accessing or editing a resource
 * poses a high security risk - such as the potential to gain privilege escalation, steal funds, or
 * obtain card numbers.
 *
 * Actions that pose a risk to interrupting service, but not a security risk do no need to require
 * administrative permissions.
 */
const administrative = function administrative(req: Request, res: Response, next: NextFunction) {
  if (disableAuth || req.user.admin) {
    next()
    return
  }
  logger.info(`Non admin user ${req.user.username} attempted to access administrative path`)
  res.render('common/error', {message: 'Action requires admin role permissions'})
}

const unauthorised = function unauthorised(req: Request, res: Response) {
  if (req.session && req.isAuthenticated()) {
    res.redirect('/')
    return
  }

  logger.warn('Unauthorised response rendered for unauthenticated session')
  res.status(403).send('User does not have permissions to access the resource')
}

const revokeSession = function revokeSession(req: Request, res: Response) {
  logger.info(`Revoking session for user ${req.user && req.user.username}`)
  req.logout()
  res.redirect('/')
}

module.exports = {
  secured,
  administrative,
  unauthorised,
  revokeSession
}
