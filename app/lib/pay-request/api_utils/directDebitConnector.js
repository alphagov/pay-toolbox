const directDebitConnectorMethods = function directDebitConnectorMethods(instance) {
  const axiosInstance = instance || this

  const accounts = function accounts() {
    return axiosInstance.get('/v1/api/accounts').then(utilExtractData)
  }

  const account = function account(id) {
    return axiosInstance.get(`/v1/api/accounts/${id}`).then(utilExtractData)
  }

  const createAccount = function createAccount(account) {
    return axiosInstance.post('/v1/api/accounts', account).then(utilExtractData)
  }

  // @TODO(sfount) extract and standardise this - there should be no need to repeat this over and over
  const utilExtractData = response => response.data

  return { accounts, account, createAccount }
}

module.exports = directDebitConnectorMethods
