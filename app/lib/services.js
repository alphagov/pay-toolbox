/**
 * High level wrapper around requests to internally accessable services
 * (admin users, connector etc.). Responsible for exposing lower level API
 * calls, scheduling health checks.
 */
const logger = require('./logger')
const payapi = require('./pay-request')
const serviceStore = require('./services.store')

// small utility method for totally healthy services
// @TODO(sfount) health check is probably a complicated enough piece to warrant a formal model with types
const totalHealthyServices = function (serviceHealthCheckResults) {
  return serviceHealthCheckResults
    .filter((healthCheckResult) => healthCheckResult.healthCheckPassed)
    .length
}

// accepts one or more service keys
// if a single service key is provided - only that service will be checked
// if an array of services is provided - that subset will be provided
// if no service key is provided, all connected services will be checked
const healthCheck = async function healthCheck (serviceKeys) {
  // @TODO(sfount) for now just support wild card requests - always
  // return all services

  // @TODO(sfount) investigate pros and cons of these methods
  const results = await Promise.all(serviceStore.data.map(async (service) => {
    const result = await healthCheckRequest(service.key)
    return { name: service.name, key: service.key, healthCheckPassed: result }
  }))
  const healthCheckCompleteTimestamp = new Date()

  logger.info(`Health check completed ${totalHealthyServices(results)}/${results.length} services responded.`)
  return { completedAt: healthCheckCompleteTimestamp, results }
}

// returns true for a valid health check, false for invalid
const healthCheckRequest = async function healthCheckRequest (serviceKey) {
  const verb = 'healthcheck'
  try {
    // const response = await payapi.service(serviceKey, verb)
    await payapi.service(serviceKey, verb)
    return true
  } catch (error) {
    logger.debug(`Health check request to ${serviceKey} failed. Threw exception ${error.code}.`)
    return false
  }
}

module.exports = { healthCheck }
