import { Request, Response } from 'express'
import { parse, ParsedQs, stringify } from 'qs'

import logger from '../../../lib/logger'
import { AdminUsers, Connector } from '../../../lib/pay-request'
import { Service, User } from '../../../lib/pay-request/types/adminUsers'
import { GatewayAccount } from '../../../lib/pay-request/types/connector'
import { wrapAsyncErrorHandler } from '../../../lib/routes'
import { sanitiseCustomBrandingURL } from './branding'
import GatewayAccountRequest from './gatewayAccountRequest.model'
import { formatPerformancePlatformCsv } from './performancePlatformCsv'
import { formatErrorsForTemplate, ClientFormError } from '../common/validationErrorFormat'
import UpdateOrganisationFormRequest from './UpdateOrganisationForm'
import { IOValidationError } from '../../../lib/errors'
import { formatServiceExportCsv } from './serviceExportCsv'
import { BooleanFilterOption } from '../common/BooleanFilterOption'
import { ServiceFilters, fetchAndFilterServices, getLiveNotArchivedServices } from './getFilteredServices'

function extractFiltersFromQuery(query: ParsedQs): ServiceFilters {
  return {
    live: query.live as BooleanFilterOption || BooleanFilterOption.True,
    internal: query.internal as BooleanFilterOption || BooleanFilterOption.False,
    archived: query.archived as BooleanFilterOption || BooleanFilterOption.False
  }
}

const overview = async function overview(req: Request, res: Response): Promise<void> {
  const filters = extractFiltersFromQuery(req.query)
  const services = await fetchAndFilterServices(filters)
  res.render('services/overview', {
    services,
    filters,
    total: services.length.toLocaleString(),
    csvUrl: `/services/csv?${stringify(filters)}`
  })
}

const listCsv = async function exportCsv(req: Request, res: Response): Promise<void> {
  const filters = extractFiltersFromQuery(req.query)
  const services = await fetchAndFilterServices(filters)

  res.set('Content-Type', 'text/csv')
  res.set('Content-Disposition', `attachment; filename="GOVUK_PAY_services_${stringify(filters)}.csv"`)
  res.status(200).send(formatServiceExportCsv(services))
}

const performancePlatformCsv = async function performancePlatformCsv(req: Request, res: Response): Promise<void> {
  const liveActiveServices = await getLiveNotArchivedServices()

  res.set('Content-Type', 'text/csv')
  res.set('Content-Disposition', `attachment; filename="GOVUK_Pay_live_services_for_perfomance_platform.csv"`)
  res.status(200).send(formatPerformancePlatformCsv(liveActiveServices))
}

const getServiceGatewayAccounts = async (gateway_account_ids: Array<string>) => {
  const serviceGatewayAccounts = []
  for (const id of gateway_account_ids) {
    serviceGatewayAccounts.push(await Connector.account(id) as GatewayAccount)
  }
  return serviceGatewayAccounts
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

  const serviceGatewayAccounts = await getServiceGatewayAccounts(service.gateway_account_ids) 

  const adminEmails = users.filter((user) => user.role.toLowerCase() == 'admin').map((user) => user.email).toString()

  res.render('services/detail', {
    service, serviceGatewayAccounts, users, serviceId, messages, adminEmails
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

const toggleAgentInitiatedMotoEnabledFlag = async function toggleAgentInitiatedMotoEnabledFlag(
  req: Request,
  res: Response
): Promise<void> {
  const serviceId = req.params.id

  const serviceResult = await AdminUsers.toggleAgentInitiatedMotoEnabledFlag(serviceId)
  const { agent_initiated_moto_enabled: state } = serviceResult
  logger.info(`Toggled agent-initiated MOTO enabled flag to ${state} for service ${serviceId}`, { externalId: serviceId })

  req.flash('info', `Agent-initiated MOTO enabled flag set to ${state} for service`)
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
): Promise<void> {
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

const toggleArchiveService = async function toggleArchiveService(
  req: Request,
  res: Response
): Promise<void> {
  const serviceId = req.params.id

  const serviceResult = await AdminUsers.toggleArchiveService(serviceId)
  const { archived } = serviceResult
  logger.info(`Toggled archive status to ${archived} for service ${serviceId}`, { externalId: serviceId })

  req.flash('info', `Service archived status changed to ${archived} for service`)
  res.redirect(`/services/${serviceId}`)
}

export default {
  overview: wrapAsyncErrorHandler(overview),
  listCsv: wrapAsyncErrorHandler(listCsv),
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
  toggleAgentInitiatedMotoEnabled: wrapAsyncErrorHandler(toggleAgentInitiatedMotoEnabledFlag),
  updateOrganisationForm: wrapAsyncErrorHandler(updateOrganisationForm),
  updateOrganisation: wrapAsyncErrorHandler(updateOrganisation),
  toggleArchiveService: wrapAsyncErrorHandler(toggleArchiveService)
}

