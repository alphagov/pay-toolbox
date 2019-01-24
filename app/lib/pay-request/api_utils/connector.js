const connectorMethods = function connectorMethods (instance) {
  const axiosInstance = instance || this

  const accounts = function accounts () {
    return axiosInstance.get('/v1/api/accounts').then(utilExtractData)
  }

  const account = function account (id) {
    return axiosInstance.get(`/v1/api/accounts/${id}`).then(utilExtractData)
  }

  const createAccount = function createAccount (account) {
    return axiosInstance.post('/v1/api/accounts', account).then(utilExtractData)
  }

  const performanceReport = function performanceReport (params) {
    const options = {}
    if (params) options.params = params
    return axiosInstance.get('/v1/api/reports/performance-report', options).then(utilExtractData)
  }

  const gatewayAccountPerformanceReport = function gatewayAccountPerformanceReport () {
    return axiosInstance.get('/v1/api/reports/gateway-account-performance-report').then(utilExtractData)
  }

  // extract and standardise this - there should be no need to repeat this over and over
  const utilExtractData = response => response.data

  return { performanceReport, gatewayAccountPerformanceReport, account, accounts, createAccount }
}

module.exports = connectorMethods
