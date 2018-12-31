// @TODO(sfount) consider this relationship - goal is to seperate the listing
// of services from the actions on services (HTTP requests etc.) to avoid
// circular dependences

// @TODO(sfount) make a data model for services - requiring certain pieces
// this would be a good place to introduce type checking
const config = require('./../config')

// @TODO(sfount) typescript/ flow for type checking
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

const lookup = function lookup (serviceKey) {
  return keyIndex[serviceKey]
}

module.exports = { data: services, lookup }
