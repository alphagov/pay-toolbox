// Pay API service utility wrapper methods
const index = {}

// @TODO(sfount) serviceStore will have to be shipped with pay-request itself
const serviceStore = require('./../../services.store')

index[serviceStore.ADMINUSERS.key] = require('./adminUsers')
index[serviceStore.CONNECTOR.key] = require('./connector')

module.exports = index
