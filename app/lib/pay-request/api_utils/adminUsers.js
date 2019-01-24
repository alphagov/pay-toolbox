// returns a flat object with helper methods for admin user API endpoints

// @TODO(sfount) high level - make a generic patch/ post/ get helper
// - get - take string - return axios.get(string).extract
// - post - take string, body - return axios.post(string, { op: ..., }.extract
// @FIXME(sfount) make a classs?
const adminUsersMethods = function adminUsersMethods (instance) {
  // this expects to be mixed with top level axios instance
  const axiosInstance = instance || this

  const service = function service (id) {
    const path = `/v1/api/services/${id}`

    // @TODO(sfount) verify this but this should be gauranteed to be mixed in with axios instance
    // instance -> this
    // return this.get(path)
    return axiosInstance.get(path).then(utilExtractData)
  }

  const services = function services () {
    const path = '/v1/api/services/list'
    return axiosInstance.get(path).then(utilExtractData)
  }

  const serviceUsers = function serviceUsers (id) {
    const path = `/v1/api/services/${id}/users`
    return axiosInstance.get(path).then(utilExtractData)
  }

  const gatewayAccountServices = function gatewayAccountServices (id) {
    return axiosInstance.get(`/v1/api/services?gatewayAccountId=${id}`).then(utilExtractData)
  }

  // example:
  // Connector.Service(id) - details
  // Connector.Service(id).updateBranding(image, css)
  // @TODO(sfount) potentially this could be Connector.Services.updateBranding()
  const updateServiceBranding = function updateServiceBranding (id, imageUrl, cssUrl) {
    const path = `/v1/api/services/${id}`
    const payload = {
      op: 'replace',
      path: 'custom_branding',
      value: { image_url: imageUrl, css_url: cssUrl }
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const updateServiceGatewayAccount = function updateServiceGatewayAccount (id, accountId) {
    const path = `/v1/api/services/${id}`
    const payload = {
      op: 'add',
      path: 'gateway_account_ids',
      value: [ accountId.toString() ]
    }

    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  // extract and standardise this - there should be no need to repeat this over and over
  const utilExtractData = response => response.data

  return { service, services, serviceUsers, updateServiceBranding, updateServiceGatewayAccount, gatewayAccountServices }
}

module.exports = adminUsersMethods
