/**
 * Simple wrapper around a REST HTTP client, ensuring correct headers are
 * provided for the GOV.UK Internal Pay API. Provides simple semantic wrappers
 * for common API end points.
 *
 * - should factor in cookies/ secrets required to make connections in production
 * - could encapsulate routes for each service connection behind tested methods
 */
const axios = require('axios')
const url = require('url')

const { RESTClientError } = require('./../../lib/errors')

// @TODO(sfount) config is going to have  to be passed dynamically
// recomend: single config at the top of the application payreqest.config(config)
const config = require('./../../config')
const logger = require('./../logger')
const serviceStore = require('./../services.store')

const serviceApiMethodUtils = require('./api_utils')

const PAY_REQUEST_TIMEOUT = 1000

// @FIXME(sfount) note that overriding this method doesn't JSON.parse the data body by default
const unpackServiceResponse = function unpackServiceReponse (data) {
  // common validations on data - ensure unpacked
  return data
}

// @FIXME(sfount) note that overrideing this method doesn't ensure POST body is JSON.stringify by default
const processServiceRequest = function processServiceRequest (data, headers) {
  // can manipulate or process common validations on data being sent
  return data
}

// @TODO(sfount) look into using Class methods
const payBaseClient = function payBaseClient (service) {
  // wrapping top level axios methods with config is also possible to use less
  // memory (over creating multiple instances) - we could also only create
  // instances where they are required
  const instance = axios.create({
    baseURL: service.target,
    timeout: PAY_REQUEST_TIMEOUT,

    // @TODO(sfount) configure headers based on each services requirements
    // headers: { 'X-Auth-header': 'secretscontent' }
    // transformResponse: [ unpackServiceResponse ],

    // @TODO(sfount) common parsing/ validation for requests
    // transformRequest: [ processServiceRequest ]

    // 5MBs content limit - will this catch us out anywhere?
    maxContentLength: 5 * 1000 * 1000
  })

  instance.metadata = {
    serviceKey: service.key,
    serviceName: service.name
  }

  // @TODO(sfount) make sure we understand the difference between interceptors and request transforms
  // @TODO(sfount) what are the performance implications of this measurement
  instance.interceptors.request.use((request) => {

    // first pass at tracking how long requests take
    request.metadata = { start: new Date() }
    // logger.debug(`[${service.key}] "${request.method}" request for ${request.url}`)
    return request
  }, (error) => Promise.reject(error))

  instance.interceptors.response.use((response) => {
    // first pass at tracking how long requests take
    // @FIXME(sfount) move to method for calculating - potentially swap out Date object requirement
    response.config.metadata.end = new Date()
    response.config.metadata.duration = response.config.metadata.end - response.config.metadata.start
    logger.debug(`[${service.key}] "${response.request.method}" success from ${response.config.url} (${response.config.metadata.duration}ms)`)
    return response
  }, (error) => {
    const code = error.response && error.response.status || error.code
    // wrap the erorr in custom errors (Y) yay
    error.config.metadata.end = new Date()
    error.config.metadata.duration = error.config.metadata.end - error.config.metadata.start
    logger.debug(`[${service.key}] "${error.config.method}" failed with ${code} from ${error.config.url} (${error.config.metadata.duration}ms)`)
    return Promise.reject(new RESTClientError(error, service.key, service.name))
  })

  // we have the option to explicitly pass ethe axios instance here
  // we should set this up so the nearest context is the Object being assigned
  const apiUtilityMethods = serviceApiMethodUtils[service.key] && serviceApiMethodUtils[service.key](instance) || {}

  // @FIXME(sfount)  for now just hard coding this - it should check to see if the service store definition has helper methods available
  // @FIXME(sfount) this is some roundabout method of making this work
  return Object.assign({}, instance, apiUtilityMethods)
}

// @FIXME(sfount) only make clients if they are imported anywhere in the code base
// @TODO(sfount) is there any issue with clients existing for the lifetime of the app? - seems like hanging connections
// could eventually cause performance issues
const AdminUsers = payBaseClient(serviceStore.ADMINUSERS)
const Connector = payBaseClient(serviceStore.CONNECTOR)
const DirectDebitConnector = payBaseClient(serviceStore.DIRECTDEBITCONNECTOR)
const Products = payBaseClient(serviceStore.PRODUCTS)
const PublicAuth = payBaseClient(serviceStore.PUBLICAUTH)

const clients = [ AdminUsers, Connector, DirectDebitConnector, Products, PublicAuth ]

// make a GET request to all supported clients
// for now supress throwing the error upwards as the calling code probably wants all results
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

// create a generic client that can be used for all queries, specialised
// clients that include security headers could also be modelled
const request = async function request (baseUrl, path, params) {
  const target = url.resolve(baseUrl, path)
  const options = {}

  if (params) {
    options.params = params
  }
  return axios.get(target, options)
}

// @TODO(sfount) return an object that applies the correct service baseUrl
// tied to requests
// for example const payapi = require('pay-request'); payapi.service(serviceKey).request...

// make a request on behalf of a service
const service = async function service (serviceKey, path, params) {
  // @FIXME(sfount) payapi should expose clients without string, i.e payapi.ADMIN_USERS.get
  const service = await serviceStore.lookup(serviceKey)

  const response = await request(service.target, path, params)
  return response.data
}

// @FIXME(sfount) @TODO(sfount)temporary implementation - remove this
const servicePost = async function servicePost (serviceKey, path, body, usePatch = false) {
  const service = serviceStore.lookup(serviceKey)

  if (!service) {
    throw new Error(`Unrecognised service key provided: ${serviceKey}`)
  }

  // @TODO(sfount) fix everything!
  const method = usePatch ? axios.patch : axios.post
  const response = await method(url.resolve(service.target, path), body)
  return response.data
}

// @FIXME(sfount) remove this remove this remove this
const serviceDelete = async function serviceDelete (serviceKey, path, body) {
  const service = serviceStore.lookup(serviceKey)

  if (!service) {
    throw new Error(`Unrecognised service key provided: ${serviceKey}`)
  }

  const response = await axios.delete(url.resolve(service.target, path), { data: body })
  return response.data
}

// allow REST client debugging
if (!config.common.production) {
  axios.interceptors.request.use((request) => {
    logger.debug(`[Pay Request] "${request.method}" request for ${request.url}`)
    return request
  })
}

// module.exports = { request, service, servicePost, serviceDelete }

// @TODO(sfount) export methods that instanciate clients only if they're required (memory++)
module.exports = { request, service, servicePost, serviceDelete, broadcast, AdminUsers, Connector, PublicAuth, Products, DirectDebitConnector }
