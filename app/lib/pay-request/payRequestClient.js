/**
 * Simple wrapper around a REST HTTP client, ensuring correct headers are
 * provided for the GOV.UK Internal Pay API. Provides simple semantic wrappers
 * for common API end points.
 *
 * - should factor in cookies/ secrets required to make connections in production
 * - could encapsulate routes for each service connection behind tested methods
 */
const https = require('https')
const axios = require('axios')

const logger = require('./../logger')
const { RESTClientError } = require('./../../lib/errors')

// @TODO(sfount) config is going to have  to be passed dynamically; recommend: single config at the top of the application payreqest.config(config)
// const config = require('./../../config')
const serviceStore = require('./../services.store')
const serviceApiMethodUtils = require('./api_utils')

const PAY_REQUEST_TIMEOUT = 3000

// @TODO(sfount) look into using Class methods
const payBaseClient = function payBaseClient (service) {
  const instance = axios.create({
    baseURL: service.target,
    timeout: PAY_REQUEST_TIMEOUT,

    // @TODO(sfount) configure headers based on each services requirements
    // headers: { 'X-Auth-header': 'secretscontent' }
    // transformResponse: [ unpackServiceResponse ],
    // transformRequest: [ processServiceRequest ]
    maxContentLength: 5 * 1000 * 1000,

    // @TODO(sfount) this should only ignore authorized TLS in a non-production
    // environment
    httpsAgent: new https.Agent({
      rejectUnauthorized: false
    })
  })

  instance.metadata = {
    serviceKey: service.key,
    serviceName: service.name
  }

  // tracking reponse times, default REST service logging
  instance.interceptors.request.use((request) => {
    request.metadata = { start: new Date() }
    return request
  }, (error) => Promise.reject(error))

  instance.interceptors.response.use((response) => {
    response.config.metadata.end = new Date()
    response.config.metadata.duration = response.config.metadata.end - response.config.metadata.start
    logger.debug(`[${service.key}] "${response.request.method}" success from ${response.config.url} (${response.config.metadata.duration}ms)`)
    return response
  }, (error) => {
    const code = (error.response && error.response.status) || error.code
    error.config.metadata.end = new Date()
    error.config.metadata.duration = error.config.metadata.end - error.config.metadata.start
    logger.debug(`[${service.key}] "${error.config.method}" failed with ${code} from ${error.config.url} (${error.config.metadata.duration}ms)`)
    return Promise.reject(new RESTClientError(error, service.key, service.name))
  })

  const apiUtilityMethods = (serviceApiMethodUtils[service.key] && serviceApiMethodUtils[service.key](instance)) || {}
  return Object.assign({}, instance, apiUtilityMethods)
}

// @FIXME(sfount) only make clients if they are imported anywhere in the code base - could eventually cause performance issues
const AdminUsers = payBaseClient(serviceStore.ADMINUSERS)
const Connector = payBaseClient(serviceStore.CONNECTOR)
const DirectDebitConnector = payBaseClient(serviceStore.DIRECTDEBITCONNECTOR)
const Products = payBaseClient(serviceStore.PRODUCTS)
const PublicAuth = payBaseClient(serviceStore.PUBLICAUTH)

const clients = [ AdminUsers, Connector, DirectDebitConnector, Products, PublicAuth ]

// make a GET request to all supported clients - for now supress throwing the error upwards as the calling code probably wants all results
const broadcast = async function broadcast (path) {
  return Promise.all(clients.map(async (client) => {
    const response = { name: client.metadata.serviceName, key: client.metadata.serviceKey }
    try {
      const result = await client.get(path)
      return Object.assign(response, { success: true, result })
    } catch (error) {
      return Object.assign(response, { success: false, error })
    }
  }))
}

module.exports = { broadcast, AdminUsers, Connector, PublicAuth, Products, DirectDebitConnector }
