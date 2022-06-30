import { getNamespace } from 'cls-hooked'

import { config } from './typed_clients/client'
import { PayRequestContext } from './typed_clients/base'
const logger = require('../logger')

function transformRequestAddHeaders() {
  const session = getNamespace('govuk-pay-logging')

  const correlationId = session.get('correlation_id')
  return {
    ...(correlationId && { 'x-request-id': correlationId })
  }
}

function successResponse(context: PayRequestContext) {
  const logContext = {
    service: context.service,
    method: context.method,
    status_code: context.status,
    url: context.url,
    response_time: context.responseTime,
    excludeFromBreadcrumb: true
  }
  logger.info(`Pay request ${context.service} success from ${context.method} ${context.url}`, logContext)
}

function failureResponse(context: PayRequestContext) {
  const logContext = {
    service: context.service,
    method: context.method,
    status_code: context.status,
    error_code: context.code,
    url: context.url,
    response_time: context.responseTime,
    excludeFromBreadcrumb: true
  }
  logger.info(`Pay request ${context.service} failed from ${context.method} ${context.url}`, logContext)
}

export function configureClients() {
  config(process.env, {
    transformRequestAddHeaders,
    successResponse,
    failureResponse
  })
} 