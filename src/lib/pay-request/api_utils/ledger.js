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
      transaction_type: 'PAYMENT',
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

<<<<<<< HEAD
  const statistics = function statistics(account, fromDate, toDate) {
=======
  const getPaymentsByState = function getPaymentsByState(account, fromDate, toDate, override) {
>>>>>>> BAU Payment count and gross return from Ledger call
    const params = {
      ...account && { account_id: account },
      from_date: fromDate,
      to_date: toDate
    }

    if (!account) {
      params.override_account_id_restriction = true
    }

    const query = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&')

    return axiosInstance.get(`/v1/report/payments_by_state?${query}`)
      .then(utilExtractData)
  }

  const paymentStatistics = function paymentStatistics(account, fromDate, toDate, override) {
    const params = {
      ...account && { account_id: account },
      ...fromDate && { from_date: fromDate },
      ...toDate && { to_date: toDate },
      ...override && { override_account_id_restriction: true }
    }

    const query = Object.keys(params)
      .map(key => `${key}=${params[key]}`)
      .join('&')

    return axiosInstance.get(`/v1/report/payments?${query}`)
      .then(utilExtractData)
  }

  return {
    transaction, transactions, events, getPaymentsByState, paymentStatistics
  }
}

module.exports = ledgerMethods
