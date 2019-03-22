const { services } = require('./../config')

const ADMINUSERS = {
  key: 'ADMINUSERS',
  name: 'Admin Users',
  target: services.ADMINUSERS_URL
}

const CONNECTOR = {
  key: 'CONNECTOR',
  name: 'Connector',
  target: services.CONNECTOR_URL
}

const DIRECTDEBITCONNECTOR = {
  key: 'DIRECTDEBITCONNECTOR',
  name: 'Direct Debit Connector',
  target: services.DIRECT_DEBIT_CONNECTOR_URL
}

const PRODUCTS = {
  key: 'PRODUCTS',
  name: 'Products',
  target: services.PRODUCTS_URL
}

const PUBLICAUTH = {
  key: 'PUBLICAUTH',
  name: 'Public Auth',
  target: services.PUBLIC_AUTH_URL
}

const data = [
  ADMINUSERS,
  CONNECTOR,
  DIRECTDEBITCONNECTOR,
  PRODUCTS,
  PUBLICAUTH
]

const keyIndex = data.reduce((index, service) => {
  index[service.key] = service
  return index
}, {})

const lookup = async function lookup(serviceKey) {
  const service = keyIndex[serviceKey]

  if (!service) {
    throw new Error(`Unrecognised service key provided: ${serviceKey}`)
  }
  return service
}

module.exports = {
  data, lookup, ADMINUSERS, CONNECTOR, DIRECTDEBITCONNECTOR, PRODUCTS, PUBLICAUTH
}
