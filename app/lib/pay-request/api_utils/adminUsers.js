const adminUsersMethods = function adminUsersMethods(instance) {
  const axiosInstance = instance || this

  const service = function service(id) {
    const path = `/v1/api/services/${id}`
    return axiosInstance.get(path).then(utilExtractData)
  }

  const services = function services() {
    const path = '/v1/api/services/list'
    return axiosInstance.get(path).then(utilExtractData)
  }

  const serviceUsers = function serviceUsers(id) {
    const path = `/v1/api/services/${id}/users`
    return axiosInstance.get(path).then(utilExtractData)
  }

  const gatewayAccountServices = function gatewayAccountServices(id) {
    return axiosInstance.get(`/v1/api/services?gatewayAccountId=${id}`).then(utilExtractData)
  }

  const updateServiceBranding = function updateServiceBranding(id, imageUrl, cssUrl) {
    const path = `/v1/api/services/${id}`
    const payload = {
      op: 'replace',
      path: 'custom_branding',
      value: { image_url: imageUrl, css_url: cssUrl }
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const updateServiceGatewayAccount = function updateServiceGatewayAccount(id, accountId) {
    const path = `/v1/api/services/${id}`
    const payload = {
      op: 'add',
      path: 'gateway_account_ids',
      value: [ accountId.toString() ]
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const updateServiceGoLiveStatus = function updateServiceGoLiveStatus(id, status) {
    const path = `v1/api/services/${id}`
    const payload = {
      op: 'replace',
      path: 'current_go_live_stage',
      value: status
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const utilExtractData = response => response.data
  return {
    service, services, serviceUsers, updateServiceBranding, updateServiceGatewayAccount, gatewayAccountServices, updateServiceGoLiveStatus
  }
}

module.exports = adminUsersMethods
