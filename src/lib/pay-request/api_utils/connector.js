/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { EntityNotFoundError } = require('../../errors')
const lodash = require('lodash')

const connectorMethods = function connectorMethods (instance) {
  const axiosInstance = instance || this

  // @TODO(sfount) extract and standardise this - there should be no need to
  // repeat this over and over
  const utilExtractData = (response) => response.data

  const handleNotFound = function handleNotFound (entityName, entityId) {
    return (error) => {
      if (error.data.response && error.data.response.status === 404) {
        throw new EntityNotFoundError(entityName, entityId)
      }
      throw error
    }
  }

  const accounts = function accounts (params) {
    params = lodash.omitBy(params, lodash.isEmpty)
    return axiosInstance.get('/v1/api/accounts', { params }).then(utilExtractData)
  }

  const account = function account (id) {
    return axiosInstance.get(`/v1/api/accounts/${id}`)
      .then(utilExtractData)
      .catch(handleNotFound('Account by id  ', id))
  }

  const accountByExternalId = function accountByExternalId (externalId) {
    return axiosInstance.get(`/v1/frontend/accounts/external-id/${externalId}`)
      .then(utilExtractData)
      .catch(handleNotFound('Account by external id  ', externalId))
  }

  const accountWithCredentials = function accountWithCredentials (id) {
    return axiosInstance.get(`/v1/frontend/accounts/${id}`).then(utilExtractData)
  }

  const acceptedCardTypes = function acceptedCardTypes (accountId) {
    return axiosInstance.get(`/v1/frontend/accounts/${accountId}/card-types`).then(utilExtractData)
  }

  const createAccount = function createAccount (accountDetails) {
    return axiosInstance.post('/v1/api/accounts', accountDetails).then(utilExtractData)
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

  const getGatewayComparisons = function getGatewayComparisons (chargeIds) {
    return axiosInstance.post('/v1/api/discrepancies/report', chargeIds).then(utilExtractData)
  }

  const getGatewayComparison = function getGatewayComparison (chargeId) {
    return getGatewayComparisons([chargeId])
  }

  const resolveDiscrepancy = function resolveDiscrepancy (chargeId) {
    return axiosInstance.post('/v1/api/discrepancies/resolve', [chargeId]).then(utilExtractData)
  }

  // eslint-disable-next-line max-len
  const searchTransactionsByReference = function searchTransactionsByReference (accountId, reference) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/charges?reference=${reference}`).then(utilExtractData)
  }

  const stripe = function stripe (accountId) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/stripe-account`).then(utilExtractData)
  }

  const charge = function charge (accountId, externalChargeId) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/charges/${externalChargeId}`).then(utilExtractData)
  }

  const refunds = function refunds (accountId, externalChargeId) {
    return axiosInstance.get(`/v1/api/accounts/${accountId}/charges/${externalChargeId}/refunds`).then(utilExtractData)
  }

  const getChargeByGatewayTransactionId = function getChargeByGatewayTransactionId (
    gatewayTransactionId
  ) {
    return axiosInstance.get(`/v1/api/charges/gateway_transaction/${gatewayTransactionId}`)
  }

  const updateCorporateSurcharge = async function updateCorporateSurcharge (id, surcharges) {
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

  const updateEmailBranding = async function updateEmailBranding (id, notifySettings) {
    const url = `/v1/api/accounts/${id}`
    await axiosInstance.patch(url, {
      op: 'replace',
      path: 'notify_settings',
      value: notifySettings
    })
  }

  const updateStripeSetupValues = function updateStripeSetupValues (id, stripeSetupFields) {
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

  const toggleBlockPrepaidCards = async function toggleBlockPrepaidCards (id) {
    const gatewayAccount = await account(id)
    const url = `/v1/api/accounts/${id}`
    await axiosInstance.patch(url, {
      op: 'replace',
      path: 'block_prepaid_cards',
      value: !gatewayAccount.block_prepaid_cards
    })
    return !gatewayAccount.block_prepaid_cards
  }

  const toggleMotoPayments = async function toggleMotoPayments (id) {
    const gatewayAccount = await account(id)
    const url = `/v1/api/accounts/${gatewayAccount.gateway_account_id}`
    await axiosInstance.patch(url, {
      op: 'replace',
      path: 'allow_moto',
      value: !gatewayAccount.allow_moto
    })
    return !gatewayAccount.allow_moto
  }

  const toggleAllowTelephonePaymentNotifications = async function toggleAllowTelephonePaymentNotifications (id) {
    const gatewayAccount = await account(id)
    const url = `/v1/api/accounts/${gatewayAccount.gateway_account_id}`
    await axiosInstance.patch(url, {
      op: 'replace',
      path: 'allow_telephone_payment_notifications',
      value: !gatewayAccount.allow_telephone_payment_notifications
    })
    return !gatewayAccount.allow_telephone_payment_notifications
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
    updateCorporateSurcharge,
    updateEmailBranding,
    toggleBlockPrepaidCards,
    toggleMotoPayments,
    toggleAllowTelephonePaymentNotifications,
    updateStripeSetupValues
  }
}

module.exports = connectorMethods
