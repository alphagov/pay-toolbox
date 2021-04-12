import { renderSync } from 'sass'
import { readFileSync } from 'fs'
import { extname, join } from 'path'
import { Request, Response } from 'express'
import { S3 } from 'aws-sdk'
import { parse, ParsedQs, stringify } from 'qs'
import crypto from 'crypto'

import logger from '../../../lib/logger'
import { AdminUsers } from '../../../lib/pay-request'
import { Service, User } from '../../../lib/pay-request/types/adminUsers'
import { wrapAsyncErrorHandler } from '../../../lib/routes'
import { sanitiseCustomBrandingURL } from './branding'
import GatewayAccountRequest from './gatewayAccountRequest.model'
import { formatPerformancePlatformCsv } from './performancePlatformCsv'
import { formatErrorsForTemplate, ClientFormError } from '../common/validationErrorFormat'
import UpdateOrganisationFormRequest from './UpdateOrganisationForm'
import { IOValidationError } from '../../../lib/errors'
import { formatServiceExportCsv } from './serviceExportCsv'
import { BooleanFilterOption } from '../common/BooleanFilterOption'

const scssTemplate = readFileSync(join(`${process.cwd()}`, '/src/web/modules/services/scss-template.scss')).toString()
const cloudfrontUrl = 'https://d106cm2l6ezls7.cloudfront.net/' //TODO env var this

interface Filters {
  live: BooleanFilterOption;
  internal: BooleanFilterOption;
  archived: BooleanFilterOption;
}

function extractFiltersFromQuery(query: ParsedQs): Filters {
  return {
    live: query.live as BooleanFilterOption || BooleanFilterOption.True,
    internal: query.internal as BooleanFilterOption || BooleanFilterOption.False,
    archived: query.archived as BooleanFilterOption || BooleanFilterOption.False
  }
}

function serviceAttributeMatchesFilter(filterValue: BooleanFilterOption, serviceValue: Boolean) {
  return filterValue === BooleanFilterOption.True && serviceValue ||
    filterValue === BooleanFilterOption.False && !serviceValue ||
    filterValue === BooleanFilterOption.All
}

async function fetchAndFilterServices(filters: Filters): Promise<Service[]> {
  const services: Service[] = await AdminUsers.services()
  return services.filter(service =>
    serviceAttributeMatchesFilter(filters.live, service.current_go_live_stage === 'LIVE')
    && serviceAttributeMatchesFilter(filters.internal, service.internal)
    && serviceAttributeMatchesFilter(filters.archived, service.archived)
  )
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
  const liveActiveServices = await fetchAndFilterServices({
    live: BooleanFilterOption.True,
    internal: BooleanFilterOption.False,
    archived: BooleanFilterOption.False
  })

  res.set('Content-Type', 'text/csv')
  res.set('Content-Disposition', `attachment; filename="GOVUK_Pay_live_services_for_perfomance_platform.csv"`)
  res.status(200).send(formatPerformancePlatformCsv(liveActiveServices))
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

const brandingLegacy = async function branding(req: Request, res: Response): Promise<void> {
  const serviceId: string = req.params.id
  const service = await AdminUsers.service(serviceId)

  res.render('services/branding-legacy', { serviceId, service, csrf: req.csrfToken() })
}

const branding = async function branding(req: Request, res: Response): Promise<void> {
  const serviceId: string = req.params.id
  const service = await AdminUsers.service(serviceId)

  res.render('services/branding', { serviceId, service, csrf: req.csrfToken() })
}

const uploadToS3 = async function uploadToS3(content: Buffer, key: string, contentType?: string): Promise<string> {
  try {
    const s3 = new S3()
    logger.info(`Uploading transactions file to S3 with key ${key}`)
    const response = await s3.putObject({
      Bucket: 'pay-govuk-custom-branding-test', //TODO env var this
      Body: content,
      ACL: 'public-read',
      Key: key, //TODO use md5hash of image contents + stringified branding options (e.g. colour etc, alignment)
      ...contentType && { ContentType: contentType }
    }).promise();
    logger.info('Upload to S3 completed', {
      fileVersionId: response.VersionId,
      fileExpiration: response.Expiration
    })
    return key
  } catch (err) {
    logger.error(`Error uploading ${key} to s3: ${err.message}`)
    throw new Error('There was an error uploading the file to S3')
  }
}

function getCssFileName(imageFileName: string): string {
  const extension = extname(imageFileName)
  if (extension) {
    return imageFileName.replace(extension, '.css')
  } else {
    return imageFileName + '.css'
  }
}

const updateBranding = async function updateBranding(req: Request, res: Response): Promise<void> {
  const tmpBrandingSessionId = crypto.randomBytes(16).toString('hex')
  if (!req.file || !req.file.buffer) {
    req.flash('error', 'Select a png/svg, 300px etc') //TODO validate
    return res.redirect(`/services/${req.params.id}/branding`)
  }

  const { id } = req.params

  try {
    const imageFileName = `${tmpBrandingSessionId}${req.file.originalname}`
    const fileKey = await uploadToS3(req.file.buffer, imageFileName)

    //TODO validate colour below
    const sass = renderSync({
      data: `
$custom-banner-colour: ${req.body.custom_banner_colour};
${scssTemplate}`,
      includePaths: ['node_modules', 'src/assets/sass']
    })
    const cssFileName = `${tmpBrandingSessionId}${getCssFileName(req.file.originalname)}`
    await uploadToS3(sass.css, cssFileName, 'text/css')

    await AdminUsers.updateServiceBranding(
      id,
      `${cloudfrontUrl}${imageFileName}`,
      `${cloudfrontUrl}${cssFileName}`
    )
    logger.info(`Updated service branding for ${id}. Image: ${cloudfrontUrl}${req.file.originalname}, Css: ${cloudfrontUrl}${cssFileName}`)

    req.flash('info', 'Custom branding uploaded and applied successfully')
    res.redirect(`/services/${req.params.id}?key=${fileKey}`)
  } catch (err) {
    logger.warn('Error uploading image', {
      message: err.message,
      filename: req.file && req.file.filename
    })
    req.flash('error', err.message)
    res.redirect(`/services/${req.params.id}/branding`)
  }
}

const updateBrandingLegacy = async function updateBrandingLegacy(req: Request, res: Response): Promise<void> {
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

export default {
  overview: wrapAsyncErrorHandler(overview),
  listCsv: wrapAsyncErrorHandler(listCsv),
  performancePlatformCsv: wrapAsyncErrorHandler(performancePlatformCsv),
  detail: wrapAsyncErrorHandler(detail),
  brandingLegacy: wrapAsyncErrorHandler(brandingLegacy),
  branding: wrapAsyncErrorHandler(branding),
  updateBrandingLegacy: wrapAsyncErrorHandler(updateBrandingLegacy),
  updateBranding: wrapAsyncErrorHandler(updateBranding),
  linkAccounts: wrapAsyncErrorHandler(linkAccounts),
  updateLinkAccounts: wrapAsyncErrorHandler(updateLinkAccounts),
  search: wrapAsyncErrorHandler(search),
  searchRequest: wrapAsyncErrorHandler(searchRequest),
  toggleTerminalStateRedirectFlag: wrapAsyncErrorHandler(toggleTerminalStateRedirectFlag),
  toggleExperimentalFeaturesEnabledFlag: wrapAsyncErrorHandler(toggleExperimentalFeaturesEnabledFlag),
  toggleAgentInitiatedMotoEnabled: wrapAsyncErrorHandler(toggleAgentInitiatedMotoEnabledFlag),
  updateOrganisationForm: wrapAsyncErrorHandler(updateOrganisationForm),
  updateOrganisation: wrapAsyncErrorHandler(updateOrganisation)
}
