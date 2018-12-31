/**
 * High level wrapper around requests to internally accessable services
 * (admin users, connector etc.). Responsible for exposing lower level API
 * calls, scheduling health checks.
 */
const payapi = require('./pay-request')
const serviceStore = require('./services.store')

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
  console.log('got all results', results)
  return { completedAt: healthCheckCompleteTimestamp, results }
}

// returns true for a valid health check, false for invalid
const healthCheckRequest = async function healthCheckRequest (serviceKey) {
  const verb = 'healthcheck'
  try {
    const response = await payapi.service(serviceKey, verb)
    console.log('response success', response.status)
    return true
  } catch (error) {
    console.log('response error', error.code)
    return false
  }
}

module.exports = { healthCheck }
