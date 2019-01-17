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

// @TODO(sfount) config is going to have  to be passed dynamically
// recomend: single config at the top of the application payreqest.config(config)
const config = require('./../../config')
const logger = require('./../logger')
const serviceStore = require('./../services.store')

const serviceApiMethodUtils = require('./api_utils')

const PAY_REQUEST_TIMEOUT = 1000

const unpackServiceResponse = function unpackServiceReponse (data) {
  // common validations on data - ensure unpacked
  return data
}

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
    transformResponse: [ unpackServiceResponse ],

    // @TODO(sfount) common parsing/ validation for requests
    transformRequest: [ processServiceRequest ]
  })

  // @TODO(sfount) make sure we understand the difference between interceptors and request transforms
  instance.interceptors.request.use((request) => {
    logger.debug(`[${service.key}] "${request.method}" request for ${request.url}`)
    return request
  })

  // we have the option to explicitly pass ethe axios instance here
  const apiUtilityMethods = serviceApiMethodUtils[service.key]() || {}

  // @FIXME(sfount)  for now just hard coding this - it should check to see if the service store definition has helper methods available
  // @FIXME(sfount) this is some roundabout method of making this work
  return Object.assign({}, instance, apiUtilityMethods)
}

// @FIXME(sfount) only make clients if they are imported anywhere in the code base
const AdminUsers = payBaseClient(serviceStore.ADMINUSERS)

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
module.exports = { request, service, servicePost, serviceDelete, AdminUsers }
