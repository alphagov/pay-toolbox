// @TODO(sfount) consider this relationship - goal is to seperate the listing
// of services from the actions on services (HTTP requests etc.) to avoid
// circular dependences
//
// @TODO(sfount) more official classes as models with Joi validation

// @TODO(sfount) make a data model for services - requiring certain pieces
// this would be a good place to introduce type checking
const config = require('./../config')

const ADMINUSERS = {
  key: 'ADMINUSERS',
  name: 'Admin Users',
  target: config.services.ADMINUSERS_URL
}

const CONNECTOR = {
  key: 'CONNECTOR',
  name: 'Connector',
  target: config.services.CONNECTOR_URL
}

const DIRECTDEBITCONNECTOR = {
  key: 'DIRECTDEBITCONNECTOR',
  name: 'Direct Debit Connector',
  target: config.services.DIRECT_DEBIT_CONNECTOR_URL
}

const PRODUCTS = {
  key: 'PRODUCTS',
  name: 'Products',
  target: config.services.PRODUCTS_URL
}

const PUBLICAUTH = {
  key: 'PUBLICAUTH',
  name: 'Public Auth',
  target: config.services.PUBLIC_AUTH_URL
}

// @TODO(sfount) typescript/ flow for type checking
const services = [
  ADMINUSERS,
  CONNECTOR,
  DIRECTDEBITCONNECTOR,
  PRODUCTS,
  PUBLICAUTH
]

const keyIndex = services.reduce((index, service) => {
  index[service.key] = service
  return index
}, {})

const lookup = async function lookup (serviceKey) {
  const service = keyIndex[serviceKey]

  if (!service) {
    throw new Error(`Unrecognised service key provided: ${serviceKey}`)
  }
  return service
}

// @TODO(sfount) temporary direct map - this is to allow pay-request to export services instantly - this can be done
// with a cleaner abstraction
const lookupSync = (serviceKey) => keyIndex[serviceKey]

module.exports = { data: services, lookup, lookupSync, ADMINUSERS, CONNECTOR, DIRECTDEBITCONNECTOR, PRODUCTS, PUBLICAUTH }
