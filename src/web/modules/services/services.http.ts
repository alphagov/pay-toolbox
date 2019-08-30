import { Request, Response } from 'express'

import * as logger from '../../../lib/logger'
import { AdminUsers } from '../../../lib/pay-request'
import { Service } from '../../../lib/pay-request/types/adminUsers'
import { wrapAsyncErrorHandler } from '../../../lib/routes'
import { sanitiseCustomBrandingURL } from './branding'
import GatewayAccountRequest from './gatewayAccountRequest.model'

const overview = async function overview(req: Request, res: Response): Promise<void> {
  const services: Service = await AdminUsers.services()
  res.render('services/overview', { services })
}

const detail = async function detail(req: Request, res: Response): Promise<void> {
  const serviceId = req.params.id
  const messages = req.flash('info')

  const [ service, users ] = await Promise.all([
    AdminUsers.service(serviceId),
    AdminUsers.serviceUsers(serviceId)
  ])

  users.forEach((user: any) => {
    const currentServicesRole = user.service_roles
      .find((serviceRole: any) => serviceRole.service && serviceRole.service.external_id === serviceId)
    user.role = currentServicesRole.role && currentServicesRole.role.name
  })

  res.render('services/detail', {
    service, users, serviceId, messages
  })
}

const branding = async function branding(req: Request, res: Response): Promise<void> {
  const serviceId: string = req.params.id
  const service = await AdminUsers.service(serviceId)

  res.render('services/branding', { serviceId, service, csrf: req.csrfToken() })
}

const updateBranding = async function updateBranding(req: Request, res: Response): Promise<void> {
  const { id } = req.params

  await AdminUsers.updateServiceBranding(id, sanitiseCustomBrandingURL(req.body.image_url), sanitiseCustomBrandingURL(req.body.css_url))

  logger.info(`Updated service branding for ${id}`)
  req.flash('info', `Service ${id} branding successfully replaced`)
  res.redirect(`/services/${id}`)
}

const linkAccounts = async function linkAccounts(req: Request, res: Response): Promise<void> {
  const serviceId = req.params.id
  const context: {
    serviceId: string;
    messages: object;
    recovered?: object;
    csrf: string;
  } = {
    serviceId,
    messages: req.flash('error'),
    csrf: req.csrfToken()
  }

  if (req.session.recovered) {
    context.recovered = Object.assign({}, req.session.recovered)
    delete req.session.recovered
  }
  res.render('services/link_accounts', context)
}

const updateLinkAccounts = async function updateLinkAccounts(
  req: Request,
  res: Response
): Promise<void> {
  const serviceId = req.params.id

  const gatewayAccountRequest = new GatewayAccountRequest(req.body)
  await AdminUsers.updateServiceGatewayAccount(serviceId, gatewayAccountRequest.id)

  logger.info(`Service ${serviceId} added gateway account ${gatewayAccountRequest.id}`)
  req.flash('info', `Gateway Account ${gatewayAccountRequest.id} linked`)
  res.redirect(`/services/${serviceId}`)
}

const search = async function search(req: Request, res: Response): Promise<void> {
  res.render('services/search', { csrf: req.csrfToken() })
}

const searchRequest = async function searchRequest(req: Request, res: Response): Promise<void> {
  const serviceId = req.body.id.trim()
  res.redirect(`/services/${serviceId}`)
}

const toggleTerminalStateRedirectFlag = async function toggleTerminalStateRedirectFlag(
  req: Request,
  res: Response
): Promise<void> {
  const serviceId = req.params.id

  const serviceResult = await AdminUsers.toggleTerminalStateRedirectFlag(serviceId)
  const { redirect_to_service_immediately_on_terminal_state: state } = serviceResult
  logger.info(`Toggled redirect to service on terminal state flag to ${state} for service ${serviceId}`, { externalId: serviceId })

  req.flash('info', `Redirect to service on terminal state flag set to ${state} for service`)
  res.redirect(`/services/${serviceId}`)
}

export default {
  overview: wrapAsyncErrorHandler(overview),
  detail: wrapAsyncErrorHandler(detail),
  branding: wrapAsyncErrorHandler(branding),
  updateBranding: wrapAsyncErrorHandler(updateBranding),
  linkAccounts: wrapAsyncErrorHandler(linkAccounts),
  updateLinkAccounts: wrapAsyncErrorHandler(updateLinkAccounts),
  search: wrapAsyncErrorHandler(search),
  searchRequest: wrapAsyncErrorHandler(searchRequest),
  toggleTerminalStateRedirectFlag: wrapAsyncErrorHandler(toggleTerminalStateRedirectFlag)
}
