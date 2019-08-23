import { EntityNotFoundError } from '../../errors'

const ledgerMethods = function ledgerMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = response => response.data
  const platformAdminQuery = 'override_account_id_restriction=true'
  const includeAllEventsQuery = 'include_all_events=true'

  const transaction = function transaction(id) {
    return axiosInstance.get(`/v1/transaction/${id}?${platformAdminQuery}`)
      .then(utilExtractData)
      .catch((error) => {
        if (error.data.response && error.data.response.status === 404) throw new EntityNotFoundError('Transaction', id)
        throw error
      })
  }

  const transactions = async function transactions(account, currentPage, currentStatus) {
    const page = currentPage || 1
    const pageSize = 20
    const externalStatusMap = {
      all: [],
      succeeded: [ 'success' ],
      failed: [ 'declined', 'timedout', 'cancelled', 'error' ],
      'in-progress': [ 'created', 'started', 'submitted', 'capturable' ]
    }

    const params = {
      page,
      override_account_id_restriction: true,
      display_size: pageSize,
      payment_states: externalStatusMap[currentStatus].join(','),
      ...account && { account_id: account }
    }

    const query = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&')

    return axiosInstance.get(`/v1/transaction?${query}`)
      .then(utilExtractData)
  }

  const events = function events(transactionId, accountId) {
    return axiosInstance.get(`/v1/transaction/${transactionId}/event?gateway_account_id=${accountId}&${includeAllEventsQuery}`)
      .then(utilExtractData)
  }

  return { transaction, transactions, events }
}

module.exports = ledgerMethods
