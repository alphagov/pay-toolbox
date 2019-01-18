const connectorMethods = function connectorMethods (instance) {
  const axiosInstance = instance || this

  const performanceReport = function performanceReport (params) {
    const options = {}

    if (params) options.params = params
    return axiosInstance.get('/v1/api/reports/performance-report', options).then(utilExtractData)
  }

  // extract and standardise this - there should be no need to repeat this over and over
  const utilExtractData = response => response.data

  return { performanceReport }
}

module.exports = connectorMethods
