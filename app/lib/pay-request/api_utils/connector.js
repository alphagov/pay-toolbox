const connectorMethods = function connectorMethods (instance) {
  const axiosInstance = instance || this

  const performanceReport = function performanceReport () {
    return axiosInstance.get('/v1/api/reports/performance-report').then(utilExtractData)
  }

  // extract and standardise this - there should be no need to repeat this over and over
  const utilExtractData = response => response.data

  return { performanceReport }
}

module.exports = connectorMethods
