import { Request, Response } from 'express'

import logger from '../../../lib/logger'
import { AdminUsers } from '../../../lib/pay-request'
import { Service, User } from '../../../lib/pay-request/types/adminUsers'
import { wrapAsyncErrorHandler } from '../../../lib/routes'
import { sanitiseCustomBrandingURL } from './branding'
import GatewayAccountRequest from './gatewayAccountRequest.model'
import { format } from './performancePlatformCsv'
import { formatErrorsForTemplate, ClientFormError } from '../common/validationErrorFormat'
import UpdateOrganisationFormRequest from './UpdateOrganisationForm'
import { IOValidationError } from '../../../lib/errors'

function filterRealLiveServices(services: Service[]) {
  return services.filter(service => service.current_go_live_stage === 'LIVE'
    && !service.internal
    && !service.archived)
}

const overview = async function overview(req: Request, res: Response): Promise<void> {
  const shouldFilterLiveServices = req.query.live !== "false"
  let services: Service[] = await AdminUsers.services()
  if ( shouldFilterLiveServices ) {
    services = filterRealLiveServices(services)
  }
  res.render('services/overview', { services, filterLive: shouldFilterLiveServices })
}

const performancePlatformCsv = async function performancePlatformCsv(req: Request, res: Response): Promise<void> {
  const services: Service[] = await AdminUsers.services()
  const liveActiveServices = filterRealLiveServices(services)

  res.set('Content-Type', 'text/csv')
  res.set('Content-Disposition', `attachment; filename="GOVUK_Pay_live_services.csv"`)
  res.status(200).send(format(liveActiveServices))
}

const detail = async function detail(req: Request, res: Response): Promise<void> {
  const serviceId = req.params.id
  const messages = req.flash('info')

  const [service, users] = await Promise.all([
    AdminUsers.service(serviceId),
    AdminUsers.serviceUsers(serviceId) as User[]
  ])

  users.forEach((user) => {
    const currentServicesRole = user.service_roles
      .find((serviceRole) => serviceRole.service && serviceRole.service.external_id === serviceId)
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

  await AdminUsers.updateServiceBranding(
    id,
    sanitiseCustomBrandingURL(req.body.image_url),
    sanitiseCustomBrandingURL(req.body.css_url)
  )

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
    context.recovered = { ...req.session.recovered }
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

const toggleExperimentalFeaturesEnabledFlag = async function toggleExperimentalFeaturesEnabledFlag(
  req: Request,
  res: Response
): Promise<void> {
  const serviceId = req.params.id

  const serviceResult = await AdminUsers.toggleExperimentalFeaturesEnabledFlag(serviceId)
  const { experimental_features_enabled: state } = serviceResult
  logger.info(`Toggled experimental features enabled flag to ${state} for service ${serviceId}`, { externalId: serviceId })

  req.flash('info', `Experimental features enabled flag set to ${state} for service`)
  res.redirect(`/services/${serviceId}`)
}

interface RecoverContext {
  service: Service;
  csrf: string;
  formValues?: object;
  errors?: object;
  errorMap?: object[];
}

const updateOrganisationForm = async function updateOrganisationForm(
  req: Request,
  res: Response
): Promise<void> {
  const service = await AdminUsers.service(req.params.id)
  const context: RecoverContext = { service, csrf: req.csrfToken() }
  const { recovered } = req.session

  if (recovered) {
    context.formValues = recovered.formValues

    if (recovered.errors) {
      context.errors = recovered.errors
      context.errorMap = recovered.errors.reduce((aggregate: {
        [key: string]: string;
      }, error: ClientFormError) => {
        // eslint-disable-next-line no-param-reassign
        aggregate[error.id] = error.message
        return aggregate
      }, {})
    }
    delete req.session.recovered
  }

  res.render('services/services.update_organisation.njk', context)
}

const updateOrganisation = async function updateOrganisation(
  req: Request,
  res: Response
) : Promise<void> {
  const { id } = req.params

  try {
    const updateRequest = new UpdateOrganisationFormRequest(req.body)
    await AdminUsers.updateServiceOrganisationName(id, updateRequest.name)
    req.flash('info', 'Updated organisation')
    res.redirect(`/services/${id}`)
  } catch (error) {
    if (error instanceof IOValidationError) {
      req.session.recovered = {
        formValues: req.body,
        errors: formatErrorsForTemplate(error.source)
      }
      res.redirect(`/services/${id}/organisation`)
      return
    }
  }
}

export default {
  overview: wrapAsyncErrorHandler(overview),
  performancePlatformCsv: wrapAsyncErrorHandler(performancePlatformCsv),
  detail: wrapAsyncErrorHandler(detail),
  branding: wrapAsyncErrorHandler(branding),
  updateBranding: wrapAsyncErrorHandler(updateBranding),
  linkAccounts: wrapAsyncErrorHandler(linkAccounts),
  updateLinkAccounts: wrapAsyncErrorHandler(updateLinkAccounts),
  search: wrapAsyncErrorHandler(search),
  searchRequest: wrapAsyncErrorHandler(searchRequest),
  toggleTerminalStateRedirectFlag: wrapAsyncErrorHandler(toggleTerminalStateRedirectFlag),
  toggleExperimentalFeaturesEnabledFlag: wrapAsyncErrorHandler(toggleExperimentalFeaturesEnabledFlag),
  updateOrganisationForm: wrapAsyncErrorHandler(updateOrganisationForm),
  updateOrganisation: wrapAsyncErrorHandler(updateOrganisation)
}

