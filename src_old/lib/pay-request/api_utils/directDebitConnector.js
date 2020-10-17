const directDebitConnectorMethods = function directDebitConnectorMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = (response) => response.data

  const accounts = function accounts() {
    return axiosInstance.get('/v1/api/accounts').then(utilExtractData)
  }

  const account = function account(id) {
    return axiosInstance.get(`/v1/api/accounts/${id}`).then(utilExtractData)
  }

  const createAccount = function createAccount(accountDetails) {
    return axiosInstance.post('/v1/api/accounts', accountDetails).then(utilExtractData)
  }

  return { accounts, account, createAccount }
}

module.exports = directDebitConnectorMethods
