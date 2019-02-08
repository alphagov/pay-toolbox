const logger = require('./../../../lib/logger')
const { broadcast } = require('./../../../lib/pay-request')
const { toFormattedDate } = require('./../../../lib/format')

const totalHealthyServices = function (serviceHealthCheckResults) {
  return serviceHealthCheckResults
    .filter((healthCheckResult) => healthCheckResult.healthCheckPassed)
    .length
}

const healthCheck = async function healthCheck () {
  const results = await broadcast('healthcheck')
  const healthChecks = results.map(({ name, key, success }) => ({ name, key, healthCheckPassed: success }))
  const healthCheckCompleteTimestamp = toFormattedDate(new Date())
  logger.info(`Health check completed ${totalHealthyServices(healthChecks)}/${healthChecks.length} services responded.`)
  return { completedAt: healthCheckCompleteTimestamp, results: healthChecks }
}

module.exports = { healthCheck }
