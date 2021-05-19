/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { EntityNotFoundError } = require('../../errors')
const lodash = require('lodash')

const connectorMethods = function connectorMethods (instance) {
  const axiosInstance = instance || this

  // @TODO(sfount) extract and standardise this - there should be no need to
  // repeat this over and over
  const utilExtractData = (response) => response.data

  function handleNotFound (entityName, entityId) {
    return (error) => {
      if (error.data.response && error.data.response.status === 404) {
        throw new EntityNotFoundError(entityName, entityId)
      }
      throw error
    }
  }

  function accounts (params) {
    params = lodash.omitBy(params, lodash.isEmpty)
    return axiosInstance.get('/v1/api/accounts', { params }).then(utilExtractData)
  }

  function account (id) {
    return axiosInstance.get(`/v1/api/accounts/${id}`)
      .then(utilExtractData)
      .catch(handleNotFound('Account by id  ', id))
  }

  function accountByExternalId (externalId) {
    return axiosInstance.get(`/v1/frontend/accounts/external-id/${externalId}`)
      .then(utilExtractData)
      .catch(handleNotFound('Account by external id  ', externalId))
  }

  function accountWithCredentials (id) {
    return axiosInstance.get(`/v1/frontend/accounts/${id}`).then(utilExtractData)
  }

  function acceptedCardTypes (accountId) {
    return axiosInstance.get(`/v1/frontend/accounts/${accountId}/card-types`).then(utilExtractData)
  }

  function createAccount (accountDetails) {
    return axiosInstance.post('/v1/api/accounts', accountDetails).then(utilExtractData)
  }

  function performanceReport () {
    return axiosInstance.get('/v1/api/reports/performance-report').then(utilExtractData)
  }

  function dailyPerformanceReport (date) {
    const params = { date }
    return axiosInstance.get('/v1/api/reports/daily-performance-report', { params }).then(utilExtractData)
  }

  function gatewayAccountPerformanceReport () {
    return axiosInstance.get('/v1/api/reports/gateway-account-performance-report').then(utilExtractData)
  }

  function searchTransactionsByChargeId (accountId, chargeId) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/charges/${chargeId}/events`).then(utilExtractData)
  }

  function getGatewayComparisons (chargeIds) {
    return axiosInstance.post('/v1/api/discrepancies/report', chargeIds).then(utilExtractData)
  }

  function getGatewayComparison (chargeId) {
    return getGatewayComparisons([chargeId])
  }

  function resolveDiscrepancy (chargeId) {
    return axiosInstance.post('/v1/api/discrepancies/resolve', [chargeId]).then(utilExtractData)
  }

  // eslint-disable-next-line max-len
  function searchTransactionsByReference (accountId, reference) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/charges?reference=${reference}`).then(utilExtractData)
  }

  function stripe (accountId) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/stripe-account`).then(utilExtractData)
  }

  function charge (accountId, externalChargeId) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/charges/${externalChargeId}`).then(utilExtractData)
  }

  function refunds (accountId, externalChargeId) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/charges/${externalChargeId}/refunds`).then(utilExtractData)
  }

  function getChargeByGatewayTransactionId (
    gatewayTransactionId
  ) {
    return axiosInstance.get(`/v1/api/charges/gateway_transaction/${gatewayTransactionId}`)
  }

  function historicalEventEmitter(startId, endId, recordType, retryDelayInSeconds) {
    const params = {
      start_id: startId,
      end_id: endId,
      record_type: recordType,
      do_not_retry_emit_until: retryDelayInSeconds
    }
    return axiosInstance.post('/v1/tasks/historical-event-emitter', null, { params })
  }

  function historicalEventEmitterByDate(startDate, endDate, retryDelayInSeconds) {
    const params = {
      start_date: startDate,
      end_date: endDate,
      do_not_retry_emit_until: retryDelayInSeconds
    }
    return axiosInstance.post('/v1/tasks/historical-event-emitter-by-date', null, { params })
  }

  function parityCheck(startId, endId, doNotReprocessValidRecords, parityCheckStatus, 
    retryDelayInSeconds, recordType) {
    const params = {
      start_id: startId,
      end_id: endId,
      do_not_reprocess_valid_records: doNotReprocessValidRecords,
      parity_check_status: parityCheckStatus,
      retry_delay_in_seconds: retryDelayInSeconds,
      record_type: recordType
    }
    return axiosInstance.post('/v1/tasks/parity-checker', null, { params })
  }

  async function updateCorporateSurcharge (id, surcharges) {
    const url = `/v1/api/accounts/${id}`
    const results = Object.keys(surcharges)
      .filter((key) => key !== '_csrf')

    for (const key of results) {
      await axiosInstance.patch(url, {
        op: 'replace',
        path: key,
        value: Number(surcharges[key])
      })
    }
  }

  async function updateEmailBranding (id, notifySettings) {
    const url = `/v1/api/accounts/${id}`
    await axiosInstance.patch(url, {
      op: 'replace',
      path: 'notify_settings',
      value: notifySettings
    })
  }

  function updateStripeSetupValues (id, stripeSetupFields) {
    const url = `/v1/api/accounts/${id}/stripe-setup`
    const payload = []

    stripeSetupFields.forEach((field) => {
      payload.push({
        op: 'replace',
        path: field,
        value: true
      })
    })

    return axiosInstance.patch(url, payload)
  }

  async function toggleBlockPrepaidCards (id) {
    const gatewayAccount = await account(id)
    const url = `/v1/api/accounts/${id}`
    await axiosInstance.patch(url, {
      op: 'replace',
      path: 'block_prepaid_cards',
      value: !gatewayAccount.block_prepaid_cards
    })
    return !gatewayAccount.block_prepaid_cards
  }

  async function toggleMotoPayments (id) {
    const gatewayAccount = await account(id)
    const url = `/v1/api/accounts/${gatewayAccount.gateway_account_id}`
    await axiosInstance.patch(url, {
      op: 'replace',
      path: 'allow_moto',
      value: !gatewayAccount.allow_moto
    })
    return !gatewayAccount.allow_moto
  }

  async function toggleAllowTelephonePaymentNotifications (id) {
    const gatewayAccount = await account(id)
    const url = `/v1/api/accounts/${gatewayAccount.gateway_account_id}`
    await axiosInstance.patch(url, {
      op: 'replace',
      path: 'allow_telephone_payment_notifications',
      value: !gatewayAccount.allow_telephone_payment_notifications
    })
    return !gatewayAccount.allow_telephone_payment_notifications
  }

  async function toggleSendPayerIpAddressToGateway (id) {
    const gatewayAccount = await accountWithCredentials(id)
    const url = `/v1/api/accounts/${gatewayAccount.gateway_account_id}`
    await axiosInstance.patch(url, {
      op: 'replace',
      path: 'send_payer_ip_address_to_gateway',
      value: !gatewayAccount.send_payer_ip_address_to_gateway
    })
    return !gatewayAccount.send_payer_ip_address_to_gateway
  }

  async function toggleWorldpayExemptionEngine(id) {
    const gatewayAccount = await account(id)
    const url = `/v1/api/accounts/${gatewayAccount.gateway_account_id}`
    const toggledValue = !(gatewayAccount.worldpay_3ds_flex && gatewayAccount.worldpay_3ds_flex.exemption_engine_enabled)
    await axiosInstance.patch(url, {
      op: 'replace',
      path: 'worldpay_exemption_engine_enabled',
      value: toggledValue
    })
    return toggledValue
  }

  return {
    performanceReport,
    gatewayAccountPerformanceReport,
    account,
    accountByExternalId,
    accounts,
    accountWithCredentials,
    acceptedCardTypes,
    createAccount,
    searchTransactionsByChargeId,
    searchTransactionsByReference,
    dailyPerformanceReport,
    getGatewayComparison,
    getGatewayComparisons,
    resolveDiscrepancy,
    stripe,
    charge,
    refunds,
    getChargeByGatewayTransactionId,
    historicalEventEmitter,
    parityCheck,
    historicalEventEmitterByDate,
    updateCorporateSurcharge,
    updateEmailBranding,
    toggleBlockPrepaidCards,
    toggleMotoPayments,
    toggleAllowTelephonePaymentNotifications,
    toggleSendPayerIpAddressToGateway,
    updateStripeSetupValues,
    toggleWorldpayExemptionEngine
  }
}

module.exports = connectorMethods
