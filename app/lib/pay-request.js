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

const config = require('./../config')
const logger = require('./logger')
const serviceStore = require('./services.store')

// create a generic client that can be used for all queries, specialised
// clients that include security headers could also be modelled
const request = async function request (baseUrl, path, params) {
  const target = url.resolve(baseUrl, path)
  const options = {}
  /*
  const reponse = await axios.get(target)
  if (repsonse.status !== 200) {
    throw new Error(response)
  }
  return response.data
  */

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
  const service = serviceStore.lookup(serviceKey)

  if (!service) {
    throw new Error(`Unrecognised service key provided: ${serviceKey}`)
  }

  const response = await request(service.target, path, params)
  return response.data
}

// @FIXME(sfount) @TODO(sfount)temporary implementation - remove this
const servicePost = async function servicePost (serviceKey, path, body) {
  const service = serviceStore.lookup(serviceKey)

  if (!service) {
    throw new Error(`Unrecognised service key provided: ${serviceKey}`)
  }

  const response = await axios.post(url.resolve(service.target, path), body)
  return response.data
}

// @FIXME(sfount) remove this remove this remove this
const serviceDelete = async function serviceDelete(serviceKey, path, body) {
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

module.exports = { request, service, servicePost, serviceDelete }
