/**
 * Simple wrapper around a REST HTTP client, ensuring correct headers are
 * provided for the GOV.UK Internal Pay API. Provides simple semantic wrappers
 * for common API end points.
 */
const https = require('https')
const axios = require('axios')
const { common } = require('./../../config')
const logger = require('./../logger')

// @TODO(sfount) external dependency on toolbox errors - should encapsulate
//               this behaviour into pay-request
const { RESTClientError } = require('./../../lib/errors')

// @TODO(sfount) config is going to have  to be passed dynamically; recommend:
//               single config at the top of the application payreqest.config(config)
const serviceStore = require('./../services.store')
const serviceApiMethodUtils = require('./api_utils')

const PAY_REQUEST_TIMEOUT = 10000

const timestampRequest = function timestampRequest(request) {
  request.metadata = { start: new Date() }
  return request
}

const logSuccessfulResponse = function logSuccessfulResponse(response) {
  response.config.metadata.end = new Date()
  response.config.metadata.duration = response.config.metadata.end - response.config.metadata.start
  logger.debug(`[${this.metadata.serviceKey}] "${response.request.method}" success from ${response.config.url} (${response.config.metadata.duration}ms)`)
  return response
}

const logFailureResponse = function logFailureResponse(error) {
  const code = (error.response && error.response.status) || error.code

  // @TODO(sfount) review how errors are passed through axios stack, favour
  //               not disabling eslint rules
  error.config.metadata.end = new Date() // eslint-disable-line no-param-reassign
  // eslint-disable-next-line no-param-reassign
  error.config.metadata.duration = error.config.metadata.end - error.config.metadata.start
  logger.debug(`[${this.metadata.serviceKey}] "${error.config.method}" failed with ${code} from ${error.config.url} (${error.config.metadata.duration}ms)`)
  return Promise.reject(
    new RESTClientError(error, this.metadata.serviceKey, this.metadata.serviceName)
  )
}

const buildPayBaseClient = function buildPayBaseClient(service) {
  const instance = axios.create({
    baseURL: service.target,
    timeout: PAY_REQUEST_TIMEOUT,
    maxContentLength: 5 * 1000 * 1000,

    // @TODO(sfount) configure headers based on each services requirements
    headers: {
      'Content-Type': 'application/json'
    },

    httpsAgent: new https.Agent({
      // ensure that production environment rejects unauthorised (non HTTPS requests)
      rejectUnauthorized: common.production
    })
  })

  instance.metadata = {
    serviceKey: service.key,
    serviceName: service.name
  }

  // tracking reponse times, default REST service logging
  instance.interceptors.request.use(timestampRequest, error => Promise.reject(error))
  instance.interceptors.response.use(
    logSuccessfulResponse.bind(instance),
    logFailureResponse.bind(instance)
  )

  const apiUtilityMethods = (serviceApiMethodUtils[service.key]
    && serviceApiMethodUtils[service.key](instance)) || {}
  return Object.assign({}, instance, apiUtilityMethods)
}

// @FIXME(sfount) only make clients if they are imported anywhere in the code
//                base - could eventually cause performance issues
const AdminUsers = buildPayBaseClient(serviceStore.ADMINUSERS)
const Connector = buildPayBaseClient(serviceStore.CONNECTOR)
const DirectDebitConnector = buildPayBaseClient(serviceStore.DIRECTDEBITCONNECTOR)
const Products = buildPayBaseClient(serviceStore.PRODUCTS)
const PublicAuth = buildPayBaseClient(serviceStore.PUBLICAUTH)

const clients = [ AdminUsers, Connector, DirectDebitConnector, Products, PublicAuth ]

// make a GET request to all supported clients - for now supress throwing the
// error upwards as the calling code probably wants all results
const broadcast = async function broadcast(path) {
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

module.exports = {
  broadcast, AdminUsers, Connector, PublicAuth, Products, DirectDebitConnector
}
