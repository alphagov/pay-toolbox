/**
 * High level wrapper around requests to internally accessable services
 * (admin users, connector etc.). Responsible for exposing lower level API
 * calls, scheduling health checks.
 */
const payapi = require('./pay-request')
const config = require('./../config')

// @TODO(sfount) make a data model for services - requiring certain pieces
// this would be a good place to introduce type checking
const services = [{
  key: 'ADMINUSERS',
  name: 'Admin Users',
  target: config.services.ADMINUSERS_URL
}, {
  key: 'CONNECTOR',
  name: 'Connector',
  target: config.services.CONNECTOR_URL
}, {
  key: 'DIRECTDEBITCONNECTOR',
  name: 'Direct Debit Connector',
  target: config.services.DIRECT_DEBIT_CONNECTOR_URL
}, {
  key: 'PRODUCTS',
  name: 'Products',
  target: config.services.PRODUCTS_URL
}, {
  key: 'PUBLICAUTH',
  name: 'Public Auth',
  target: config.services.PUBLIC_AUTH_URL
}]
const keyIndex = services.reduce((index, service) => {
  index[service.key] = service
  return index
}, {})

// accepts one or more service keys
// if a single service key is provided - only that service will be checked
// if an array of services is provided - that subset will be provided
// if no service key is provided, all connected services will be checked
const healthCheck = async function healthCheck (serviceKeys) {

}

const healthCheckRequest = async function healthCheckRequest (serviceKey) {
  const verb = 'healthcheck'
  return payapi.service(serviceKey, verb)
}

const lookup = function lookup (serviceKey) {
  return keyIndex[serviceKey]
}

module.exports = { healthCheck, lookup }
