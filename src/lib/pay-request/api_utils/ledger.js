import { EntityNotFoundError } from '../../errors'

const ledgerMethods = function ledgerMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = (response) => response.data
  const platformAdminQuery = 'override_account_id_restriction=true'
  const includeAllEventsQuery = 'include_all_events=true'

  const handleNotFound = function handleNotFound(entityName, entityId) {
    return (error) => {
      if (error.data.response && error.data.response.status === 404) {
        throw new EntityNotFoundError(entityName, entityId)
      }
      throw error
    }
  }

  const transaction = function transaction(id) {
    return axiosInstance.get(`/v1/transaction/${id}?${platformAdminQuery}`)
      .then(utilExtractData)
      .catch(handleNotFound('Transaction', id))
  }

  const transactions = async function transactions(account, currentPage, currentStatus, filters) {
    const page = currentPage || 1
    const pageSize = 20
    const externalStatusMap = {
      all: [],
      succeeded: [ 'success' ],
      failed: [ 'declined', 'timedout', 'cancelled', 'error' ],
      'in-progress': [ 'created', 'started', 'submitted', 'capturable' ]
    }
    const states = currentStatus ? externalStatusMap[currentStatus] : externalStatusMap.all

    const params = {
      page,
      override_account_id_restriction: true,
      display_size: pageSize,
      payment_states: states.join(','),
      transaction_type: 'PAYMENT',
      exact_reference_match: true,
      ...filters,
      ...account && { account_id: account }
    }

    return axiosInstance.get('/v1/transaction', { params })
      .then(utilExtractData)
  }

  const transactionsByReference = async function transactionsByReference(reference, limit = 2) {
    return transactions(null, null, null, { reference, display_size: limit })
  }
  const relatedTransactions = async function relatedTransactions(id, accountId) {
    const params = {
      gateway_account_id: accountId
    }
    return axiosInstance.get(`/v1/transaction/${id}/transaction`, { params })
      .then(utilExtractData)
  }

  const events = function events(transactionId, accountId) {
    return axiosInstance.get(`/v1/transaction/${transactionId}/event?gateway_account_id=${accountId}&${includeAllEventsQuery}`)
      .then(utilExtractData)
  }

  const getPaymentsByState = function getPaymentsByState(account, fromDate, toDate) {
    const params = {
      ...account && { account_id: account },
      from_date: fromDate,
      to_date: toDate
    }

    if (!account) {
      params.override_account_id_restriction = true
    }

    const query = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&')

    return axiosInstance.get(`/v1/report/payments_by_state?${query}`)
      .then(utilExtractData)
  }

  const paymentStatistics = function paymentStatistics(account, fromDate, toDate) {
    const params = {
      ...account && { account_id: account },
      ...fromDate && { from_date: fromDate },
      ...toDate && { to_date: toDate },
      override_from_date_validation: true
    }

    if (!account) {
      params.override_account_id_restriction = true
    }

    const query = Object.keys(params)
      .map((key) => `${key}=${params[key]}`)
      .join('&')

    return axiosInstance.get(`/v1/report/transactions-summary?${query}`)
      .then(utilExtractData)
  }

  return {
    transaction,
    transactions,
    events,
    getPaymentsByState,
    paymentStatistics,
    transactionsByReference,
    relatedTransactions
  }
}

module.exports = ledgerMethods
