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

const serviceStore = require('./services.store')

// create a generic client that can be used for all queries, specialised
// clients that include security headers could also be modelled
const request = async function request (baseUrl, path) {
  const target = url.resolve(baseUrl, path)
  /*
  const reponse = await axios.get(target)
  if (repsonse.status !== 200) {
    throw new Error(response)
  }
  return response.data
  */
  return axios.get(target)
}

// @TODO(sfount) return an object that applies the correct service baseUrl
// tied to requests
// for example const payapi = require('pay-request'); payapi.service(serviceKey).request...

// make a request on behalf of a service
const service = async function service (serviceKey, path) {
  const service = serviceStore.lookup(serviceKey)

  if (!service) {
    throw new Error(`Unrecognised service key provided: ${serviceKey}`)
  }

  return request(service.target, path)
}

module.exports = { request, service }
