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

  const performanceReport = function performanceReport () {
    return axiosInstance.get('/v1/api/reports/performance-report').then(utilExtractData)
  }

  const dailyPerformanceReport = function dailyPerformanceReport (date) {
    const params = { date }
    return axiosInstance.get('/v1/api/reports/daily-performance-report', { params }).then(utilExtractData)
  }

  const gatewayAccountPerformanceReport = function gatewayAccountPerformanceReport () {
    return axiosInstance.get('/v1/api/reports/gateway-account-performance-report').then(utilExtractData)
  }

  const searchTransactionsByChargeId = function searchTransactionsByChargeId (accountId, chargeId) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/charges/${chargeId}/events`).then(utilExtractData)
  }

  const searchTransactionsByReference = function searchTransactionsByReference (accountId, reference) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/charges?reference=${reference}`).then(utilExtractData)
  }

  // @TODO(sfount) extract and standardise this - there should be no need to repeat this over and over
  const utilExtractData = response => response.data

  return { performanceReport, gatewayAccountPerformanceReport, account, accounts, createAccount, searchTransactionsByChargeId, searchTransactionsByReference, dailyPerformanceReport }
}

module.exports = connectorMethods
