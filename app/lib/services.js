/**
 * High level wrapper around requests to internally accessable services
 * (admin users, connector etc.). Responsible for exposing lower level API
 * calls, scheduling health checks.
 */
const logger = require('./logger')
const { broadcast } = require('./pay-request')

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
const healthCheck = async function healthCheck () {
  const results = await broadcast('healthcheck')
  const healthChecks = results.map(({ name, key, success }) => ({ name, key, healthCheckPassed: success }))
  const healthCheckCompleteTimestamp = new Date()
  logger.info(`Health check completed ${totalHealthyServices(healthChecks)}/${healthChecks.length} services responded.`)
  return { completedAt: healthCheckCompleteTimestamp, results: healthChecks }
}

module.exports = { healthCheck }
