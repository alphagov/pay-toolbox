import {Request, Response} from 'express'
import {ParsedQs, stringify} from 'qs'

import logger from '../../../lib/logger'
import {AdminUsers, Connector} from '../../../lib/pay-request/client'
import type {Service, User} from '../../../lib/pay-request/services/admin_users/types'
import {wrapAsyncErrorHandler} from '../../../lib/routes'
import {sanitiseCustomBrandingURL} from './branding'
import GatewayAccountRequest from './gatewayAccountRequest.model'
import {formatPerformancePlatformCsv} from './performancePlatformCsv'
import {formatErrorsForTemplate, ClientFormError} from '../common/validationErrorFormat'
import UpdateOrganisationFormRequest from './UpdateOrganisationForm'
import {IOValidationError} from '../../../lib/errors'
import {formatServiceExportCsv} from './serviceExportCsv'
import {BooleanFilterOption} from '../common/BooleanFilterOption'
import {ServiceFilters, fetchAndFilterServices, getLiveNotArchivedServices} from './getFilteredServices'

import path from 'path'
import sass from 'sass'
import fs from 'fs/promises'

import { NoSuchKey, S3 } from '@aws-sdk/client-s3'

const client = new S3({})

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
    serviceGatewayAccounts.push(await Connector.accounts.retrieveAPI(id))
  }
  return serviceGatewayAccounts
}

const detail = async function detail(req: Request, res: Response): Promise<void> {
  const serviceId = req.params.id
  const messages = req.flash('info')

  const [service, users] = await Promise.all([
    AdminUsers.services.retrieve(serviceId),
    AdminUsers.services.listUsers(serviceId)
  ])

  const userDetails = users.map(user => {
    const currentServicesRole = user.service_roles
      .find((serviceRole) => serviceRole.service && serviceRole.service.external_id === serviceId)
    return {
      external_id: user.external_id,
      role: currentServicesRole.role.name,
      email: user.email,
      disabled: user.disabled
    }
  })

  const serviceGatewayAccounts = await getServiceGatewayAccounts(service.gateway_account_ids)

  const adminEmails = userDetails
    .filter((userDetail) => userDetail.role.toLowerCase() == 'admin')
    .map((userDetail) => userDetail.email)
    .toString()

  res.render('services/detail', {
    service,
    serviceGatewayAccounts,
    users: userDetails,
    serviceId,
    messages,
    adminEmails
  })
}

const branding = async function branding(req: Request, res: Response): Promise<void> {
  const serviceId: string = req.params.id
  const service = await AdminUsers.services.retrieve(serviceId)

  res.render('services/branding', {serviceId, service, csrf: req.csrfToken()})
}

const updateBranding = async function updateBranding(req: Request, res: Response): Promise<void> {
  const {id} = req.params

  await AdminUsers.services.update(id, {
      custom_branding: {
        // image_url: sanitiseCustomBrandingURL(req.body.image_url),
        // css_url: sanitiseCustomBrandingURL(req.body.css_url)
        image_url: req.body.image_url,
        css_url: req.body.css_url
      }
    }
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
    context.recovered = {...req.session.recovered}
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
  await AdminUsers.services.update(serviceId, {
    gateway_account_ids: [gatewayAccountRequest.id.toString()]
  })

  logger.info(`Service ${serviceId} added gateway account ${gatewayAccountRequest.id}`)
  req.flash('info', `Gateway Account ${gatewayAccountRequest.id} linked`)
  res.redirect(`/services/${serviceId}`)
}

const search = async function search(req: Request, res: Response): Promise<void> {
  res.render('services/search', {csrf: req.csrfToken()})
}

const searchRequest = async function searchRequest(req: Request, res: Response): Promise<void> {
  const isAdminusersUuid = /^[0-9a-f]{8}[0-9a-f]{4}[1-5][0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/
  const filtered = !!req.body.options
  const term = req.body.term.trim()
  if (term !== '') {
    if (isAdminusersUuid.test(term)) {
      res.redirect(`/services/${term}`)
    } else {
      const data = await AdminUsers.services.search({
        service_name: term,
        service_merchant_name: term
      })
      const nameResults = data.name_results.map((serv: Service) => Object.assign(serv, {matched: 'name'}))
      let merchantResults = data.merchant_results.map((serv: Service) => Object.assign(serv, {matched: 'merchant'}))

      // remove results from merchantResults if we have already found the service in nameResults
      const servIds = new Set(nameResults.map((serv: Service) => serv.id))
      merchantResults = merchantResults.filter((serv: Service) => !servIds.has(serv.id))
      const results = filtered
        ? [...nameResults.filter((serv: Service) => serv.current_go_live_stage === 'LIVE'), ...merchantResults.filter((serv: Service) => serv.current_go_live_stage === 'LIVE')]
        : [...nameResults, ...merchantResults]

      res.render('services/search_results', {
        term,
        filtered,
        results,
        total: results.length.toLocaleString(),
        csrf: req.csrfToken()
      })
    }
  } else {
    res.render('services/search', {csrf: req.csrfToken(), error: 'Please enter a search term'})
  }
}

const toggleTerminalStateRedirectFlag = async function toggleTerminalStateRedirectFlag(
  req: Request,
  res: Response
): Promise<void> {
  const serviceId = req.params.id

  const service = await AdminUsers.services.retrieve(serviceId);
  const enable = !service.redirect_to_service_immediately_on_terminal_state;
  await AdminUsers.services.update(serviceId, {
    redirect_to_service_immediately_on_terminal_state: enable
  })
  logger.info(`Toggled redirect to service on terminal state flag to ${enable} for service ${serviceId}`, {externalId: serviceId})

  req.flash('info', `Redirect to service on terminal state ${ enable? 'enabled' : 'disabled'}`)
  res.redirect(`/services/${serviceId}`)
}

const toggleExperimentalFeaturesEnabledFlag = async function toggleExperimentalFeaturesEnabledFlag(
  req: Request,
  res: Response
): Promise<void> {
  const serviceId = req.params.id

  const service = await AdminUsers.services.retrieve(serviceId);
  const enable = !service.experimental_features_enabled
  await AdminUsers.services.update(serviceId, {
    experimental_features_enabled: enable
  })
  logger.info(`Toggled experimental features enabled flag to ${enable} for service ${serviceId}`, {externalId: serviceId})

  req.flash('info', `Experimental features ${ enable? 'enabled' : 'disabled'}`)
  res.redirect(`/services/${serviceId}`)
}

const toggleAgentInitiatedMotoEnabledFlag = async function toggleAgentInitiatedMotoEnabledFlag(
  req: Request,
  res: Response
): Promise<void> {
  const serviceId = req.params.id

  const service = await AdminUsers.services.retrieve(serviceId);
  const enable = !service.agent_initiated_moto_enabled
  await AdminUsers.services.update(serviceId, {
    agent_initiated_moto_enabled: enable
  })
  logger.info(`Toggled agent-initiated MOTO enabled flag to ${enable} for service ${serviceId}`, {externalId: serviceId})

  req.flash('info', `Agent-initiated MOTO ${ enable? 'enabled' : 'disabled'}`)
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
  const service = await AdminUsers.services.retrieve(req.params.id)
  const context: RecoverContext = {service, csrf: req.csrfToken()}
  const {recovered} = req.session

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
  const {id} = req.params

  try {
    const updateRequest = new UpdateOrganisationFormRequest(req.body)
    await AdminUsers.services.update(id, {
      'merchant_details/name': updateRequest.name
    })
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

  const service = await AdminUsers.services.retrieve(serviceId);
  const archive = !service.archived
  await AdminUsers.services.update(serviceId, {
    archived: archive
  })
  logger.info(`Toggled archive status to ${archive} for service ${serviceId}`, {externalId: serviceId})

  req.flash('info', `Service ${archive ? 'archived': 'un-archived'}`)
  res.redirect(`/services/${serviceId}`)
}

async function futurePaymentPageBrandingPage(req: Request, res: Response): Promise<void> {
  const serviceId: string = req.params.id
  const service = await AdminUsers.services.retrieve(serviceId)
  let form: any = {}

  if (service.custom_branding) {
    // try and get the files from s3
    if (service.custom_branding.css_url) {
      const parsed = new URL(service.custom_branding.css_url)
      console.log(parsed)
      try {
        const css = await client.getObject({
          Bucket: 'sfount-govuk-pay',
          Key: parsed.pathname.substring(1)
        })
        form = { ...form, ...css.Metadata }
        console.log('got css', css)
      } catch (error) {
        console.log('failed to get css') 
      }
    }

    if (service.custom_branding.image_url) {
      const parsed = new URL(service.custom_branding.image_url)
      form.image_url = service.custom_branding.image_url
    }
  }

  res.render(`services/branding/payment_page_branding`, { service, serviceId, csrf: req.csrfToken(), form })
  return
}

enum brandingVariables {
  BANNER_COLOUR = 'banner-colour',
  BANNER_BORDER_COLOUR = 'banner-border-colour'
}

const variableMap: { [key: string]: string } = {
  [brandingVariables.BANNER_COLOUR]: '$custom-banner-colour',
  [brandingVariables.BANNER_BORDER_COLOUR]: '$custom-banner-border-colour'
}

function formatBrandingVariables(variableBody: { [key: string]: string }): string {
  let compiledString = ''
  for (const variable of Object.values(brandingVariables)) {
    console.log('checking', variable)
    if (variableBody[variable]) {
      compiledString = compiledString.concat(`${variableMap[variable]}: ${variableBody[variable]};\n`)
    }
  }
  return compiledString
}

async function resetBranding(req: Request, res: Response) {
  const serviceId: string = req.params.id
  const service = await AdminUsers.services.retrieve(serviceId)
  await AdminUsers.services.update(service.external_id, {
    custom_branding: {}
  }) 
  req.flash('info', `Branding reset to Default GOV.UK`)
  res.redirect(`/services/${service.external_id}`)
}

// take some settings from the page, generate sass output
async function submitFuturePaymentPageBranding(req: Request, res: Response) {
  console.log('file received from browser', req.body)
  console.log(req.file)
  const serviceId: string = req.params.id
  const service = await AdminUsers.services.retrieve(serviceId)

  console.log('submitting ')

  const formatted = formatBrandingVariables(req.body)

  // get the root file
  const file = await fs.readFile(path.join(__dirname, 'branding/custom.scss'))

  // come up with better way to do root (theres already a method I think)
  const compiled = sass.compileString(formatted.concat(file.toString()), { loadPaths: [
    // this is where I've copied files from the frontend repo -- it could be replaced by node_modules ref
    path.join(__dirname, 'branding'),
    path.join(__dirname, '../../../../node_modules/pay-frontend/app/assets/sass'),
    path.join(__dirname, '../../../../node_modules/pay-products-ui/app/assets/sass'),
    // need a reference to payment links modules as well

    // this gives access to govuk-frontend and govuk-accessible-autocomplete
    path.join(__dirname, '../../../../node_modules') 
  ] })
  
  // console.log('read file', file.toString())

  // some findings 
  // { loadPaths: [] // should be absolute path to node modules folder }

  // will likely have to - read the file
  // add the variables formatted and up front (w/ simple unit test)
  // run compile and upload that string


  // in variable file
  // $mycolour: custom_value;

  // in actual sass file
  // $mycolour: default_value !default;
  const adminusersPayload: any = {}

  const cssKey = `${service.external_id}.css`
  const response = await client.putObject({
    Bucket: 'sfount-govuk-pay',
    Body: compiled.css,
    Key: cssKey,
    Metadata: req.body,
    ContentType: 'text/css',
    ACL: 'public-read'
  })
  adminusersPayload.css_url = 'https://da49zv8eg7hhn.cloudfront.net/' + cssKey + '?hash=' + res.locals.toolboxId

  if (req.file) {
    const imageKey = `${service.external_id}-${req.file.originalname}`
    const imageUpload = await client.putObject({
      Bucket: 'sfount-govuk-pay',
      Body: req.file.buffer,
      Key: imageKey,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    })

    adminusersPayload.image_url = 'https://da49zv8eg7hhn.cloudfront.net/' + imageKey + '?hash=' + res.locals.toolboxId
    console.log('uploaded image file')
  } else {
    if (service.custom_branding && service.custom_branding.image_url) {
      adminusersPayload.image_url = service.custom_branding.image_url
    }
  }

  console.log('uploaded css to s3', response)

  console.log('custom', formatted)

  await AdminUsers.services.update(service.external_id, {
    custom_branding: adminusersPayload
  })

  req.flash('info', `Branding updated`)
  res.redirect(`/services/${service.external_id}`)
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
  toggleArchiveService: wrapAsyncErrorHandler(toggleArchiveService),
  futurePaymentPageBrandingPage: wrapAsyncErrorHandler(futurePaymentPageBrandingPage),
  submitFuturePaymentPageBranding: wrapAsyncErrorHandler(submitFuturePaymentPageBranding),
  resetBranding: wrapAsyncErrorHandler(resetBranding)
}

