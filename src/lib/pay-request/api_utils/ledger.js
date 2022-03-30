import { EntityNotFoundError } from '../../errors'

const ledgerMethods = function ledgerMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = (response) => response.data
  const platformAdminQuery = 'override_account_id_restriction=true'
  const includeAllEventsQuery = 'include_all_events=true'

  const paymentFilterStatusMap = {
    all: [],
    succeeded: ['success'],
    failed: ['declined', 'timedout', 'cancelled', 'error'],
    'in-progress': ['created', 'started', 'submitted', 'capturable']
  }
  const refundFilterStatusMap = {
    all: [],
    succeeded: ['success'],
    failed: ['error'],
    'in-progress': ['submitted']
  }

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

  function resolvePaymentStates(statusFilter) {
    return statusFilter ? paymentFilterStatusMap[statusFilter] : paymentFilterStatusMap.all
  }

  function resolveRefundStates(statusFilter) {
    return statusFilter ? refundFilterStatusMap[statusFilter] : paymentFilterStatusMap.all
  }

  const transactions = async function transactions(
    account,
    currentPage,
    currentStatus,
    filters,
    fetchAsCSV = false,
    transactionType = 'PAYMENT'
  ) {
    const page = currentPage || 1
    const pageSize = 20
    const limitTotalSize = 5000

    const params = {
      page,
      override_account_id_restriction: true,
      display_size: pageSize,
      transaction_type: fetchAsCSV ? '' : transactionType,
      exact_reference_match: true,
      limit_total: true,
      limit_total_size: limitTotalSize,
      ...filters,
      ...account && { account_id: account }
    }
    if (transactionType === 'PAYMENT') {
      params.payment_states = resolvePaymentStates(currentStatus).join(',')
    } else if (transactionType === 'REFUND') {
      params.refund_states = resolveRefundStates(currentStatus).join(',')
    }

    const headers = fetchAsCSV ? {
      Accept: 'text/csv',
      'Content-Type': 'text/csv'
    } : null

    return axiosInstance.get('/v1/transaction', { params, ...headers && { headers } })
      .then(utilExtractData)
  }

  const transactionsByReference = async function transactionsByReference(reference, limit = 2) {
    return transactions(null, null, null, { reference, display_size: limit })
  }
  const transactionsByGatewayTransactionId = function transactionsByGatewayTransactionId(gatewayTransactionId, limit = 2) {
    return transactions(null, null, null, { gateway_transaction_id: gatewayTransactionId, display_size: limit })
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

    return axiosInstance.get('/v1/report/payments_by_state', { params })
      .then(utilExtractData)
  }

  const paymentStatistics = function paymentStatistics(account, fromDate, toDate, include_moto_statistics) {
    const params = {
      ...account && { account_id: account },
      ...fromDate && { from_date: fromDate },
      ...toDate && { to_date: toDate },
      override_from_date_validation: true,
      include_moto_statistics: include_moto_statistics
    }

    if (!account) {
      params.override_account_id_restriction = true
    }

    return axiosInstance.get('/v1/report/transactions-summary', { params })
      .then(utilExtractData)
  }
  const gatewayMonthlyPerformanceReport = function gatewayMonthlyPerformanceReport(fromDate, toDate) {
    const params = {
      from_date: fromDate,
      to_date: toDate
    }

    return axiosInstance.get('/v1/report/gateway-performance-report', { params })
      .then(utilExtractData)
  }

  const paymentVolumesByHour = function paymentVolumesByHour(fromDate, toDate) {
    const params = {
      from_date: fromDate,
      to_date: toDate
    }
    return axiosInstance.get('/v1/report/transactions-by-hour', { params })
      .then(utilExtractData)
  }

  // This is used by live payments dashboard to get accurate inflight payment data. This should not
  // be used for querying over a large date range as this directly queries the transaction table
  // in ledger which will result in poor performance.
  function paymentVolumesAggregateLegacy(fromDate, toDate, state) {
    const params = {
      from_date: fromDate,
      to_date: toDate,
      ...state && { state }

    }
    return axiosInstance.get('/v1/report/performance-report-legacy', { params })
      .then(utilExtractData)
  }

   function paymentVolumesAggregate(fromDate, toDate, state) {
    const params = {
      from_date: fromDate,
      to_date: toDate,
      ...state && { state }

    }
    return axiosInstance.get('/v1/report/performance-report', { params })
      .then(utilExtractData)
  }

  const eventTicker = function eventTicker(fromDate, toDate) {
    const params = {
      from_date: fromDate,
      to_date: toDate
    }
    return axiosInstance.get('/v1/event/ticker', { params })
      .then(utilExtractData)
  }

  const transactionByGatewayTransactionId = function transactionByGatewayTransactionId(id, paymentProvider) {
    return axiosInstance.get(`/v1/transaction/gateway-transaction/${id}?payment_provider=${paymentProvider}`)
      .then(utilExtractData)
      .catch(handleNotFound('Transaction', id))
  }

  const payouts = function getPayouts(account, state, currentPage) {
    const page = currentPage || 1
    const pageSize = 20
    const params = {
      page,
      display_size: pageSize,
      ...account && { gateway_account_id: account },
      ...state && { state: state }
    }

    if (!account) {
      params.override_account_id_restriction = true
    }

    return axiosInstance.get('/v1/payout', { params })
      .then(utilExtractData)
  }

  return {
    transaction,
    transactions,
    events,
    getPaymentsByState,
    paymentStatistics,
    transactionsByReference,
    transactionsByGatewayTransactionId,
    relatedTransactions,
    paymentVolumesByHour,
    paymentVolumesAggregateLegacy,
    paymentVolumesAggregate,
    eventTicker,
    gatewayMonthlyPerformanceReport,
    transactionByGatewayTransactionId,
    payouts
  }
}

module.exports = ledgerMethods
