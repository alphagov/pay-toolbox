const connectorMethods = function connectorMethods(instance) {
  const axiosInstance = instance || this

  // @TODO(sfount) extract and standardise this - there should be no need to
  // repeat this over and over
  const utilExtractData = response => response.data

  const accounts = function accounts() {
    return axiosInstance.get('/v1/api/accounts').then(utilExtractData)
  }

  const account = function account(id) {
    return axiosInstance.get(`/v1/api/accounts/${id}`).then(utilExtractData)
  }

  const createAccount = function createAccount(accountDetails) {
    return axiosInstance.post('/v1/api/accounts', accountDetails).then(utilExtractData)
  }

  const performanceReport = function performanceReport() {
    return axiosInstance.get('/v1/api/reports/performance-report').then(utilExtractData)
  }

  const dailyPerformanceReport = function dailyPerformanceReport(date) {
    const params = { date }
    return axiosInstance.get('/v1/api/reports/daily-performance-report', { params }).then(utilExtractData)
  }

  const gatewayAccountPerformanceReport = function gatewayAccountPerformanceReport() {
    return axiosInstance.get('/v1/api/reports/gateway-account-performance-report').then(utilExtractData)
  }

  const searchTransactionsByChargeId = function searchTransactionsByChargeId(accountId, chargeId) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/charges/${chargeId}/events`).then(utilExtractData)
  }

  const getGatewayComparisons = function getGatewayComparisons(chargeIds) {
    return axiosInstance.post('/v1/api/discrepancies/report', chargeIds).then(utilExtractData)
  }

  const getGatewayComparison = function getGatewayComparison(chargeId) {
    return getGatewayComparisons([ chargeId ])
  }

  const resolveDiscrepancy = function resolveDiscrepancy(chargeId) {
    return axiosInstance.post('/v1/api/discrepancies/resolve', [ chargeId ]).then(utilExtractData)
  }

  // eslint-disable-next-line max-len
  const searchTransactionsByReference = function searchTransactionsByReference(accountId, reference) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/charges?reference=${reference}`).then(utilExtractData)
  }

  return {
    performanceReport,
    gatewayAccountPerformanceReport,
    account,
    accounts,
    createAccount,
    searchTransactionsByChargeId,
    searchTransactionsByReference,
    dailyPerformanceReport,
    getGatewayComparison,
    getGatewayComparisons,
    resolveDiscrepancy
  }
}

module.exports = connectorMethods
