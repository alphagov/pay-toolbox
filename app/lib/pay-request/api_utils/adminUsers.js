// returns a flat object with helper methods for admin user API endpoints

// @FIXME(sfount) make a classs?
const adminUsersMethods = function adminUsersMethods (instance) {
  // this expects to be mixed with top level axios instance
  const axiosInstance = instance || this

  const service = function services (id) {
    const path = `/v1/api/services/${id}`

    // @TODO(sfount) verify this but this should be gauranteed to be mixed in with axios instance
    // instance -> this
    // return this.get(path)
    return axiosInstance.get(path)
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
    return axiosInstance.patch(path, payload)
  }

  return { service, updateServiceBranding }
}

module.exports = adminUsersMethods
