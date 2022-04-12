const { EntityNotFoundError, NotImplementedError } = require('../../errors')
const moment = require('moment')

const adminUsersMethods = function adminUsersMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = (response) => response.data

  const redactOtp = (service) => {
    // eslint-disable-next-line no-param-reassign
    delete service.otp_key
    return service
  }

  const handleNotFound = function handleNotFound(entityName, entityId) {
    return (error) => {
      if (error.data.response && error.data.response.status === 404) {
        throw new EntityNotFoundError(entityName, entityId)
      }
      throw error
    }
  }

  const findUser = function findUser(email) {
    const path = '/v1/api/users/find'
    return axiosInstance.post(path, { username: email })
      .then(utilExtractData)
      .catch((error) => {
        if (error.data.response && error.data.response.status === 404) throw new EntityNotFoundError('User', email, 'Email')
        throw error
      })
  }

  const searchServices = (serviceNameSearchString, serviceMerchantNameSearchString) => {
    const path = `/v1/api/services/search`
    const payload = {
      service_name: serviceNameSearchString,
      service_merchant_name: serviceMerchantNameSearchString
    }
    return axiosInstance.post(path, payload).then(utilExtractData)
  }

  const user = function user(id) {
    const path = `/v1/api/users/${id}`
    return axiosInstance.get(path)
      .then(utilExtractData)
      .then(redactOtp)
      .catch((error) => {
        if (error.data.response && error.data.response.status === 404) throw new EntityNotFoundError('User', id, 'External ID')
        throw error
      })
  }

  const updateUserPhone = function updateUserPhone(id, phoneNumber) {
    const path = `/v1/api/users/${id}`
    const payload = {
      op: 'replace',
      path: 'telephone_number',
      value: phoneNumber
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const updateUserEmail = function updateUserEmail(id, email) {
    const path = `/v1/api/users/${id}`
    const payload = {
      op: 'replace',
      path: 'email',
      value: email
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const toggleUserEnabled = async function toggleUserEnabled(id) {
    const path = `/v1/api/users/${id}`
    const currentUser = await user(id)

    const payload = {
      op: 'replace',
      path: 'disabled',
      value: !currentUser.disabled
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const service = function service(id) {
    const path = `/v1/api/services/${id}`
    return axiosInstance.get(path)
      .then(utilExtractData)
      .catch((error) => {
        if (error.data.response && error.data.response.status === 404) {
          throw new EntityNotFoundError('Service', id, 'External ID')
        }
        throw error
      })
  }

  const removeUserFromService = function removeUserFromService(serviceId, userId) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const path = `/v1/api/services/${serviceId}/users/${userId}`

    // @TODO(sfount) make sure admin headers are correctly set to allow user to be removed
    throw new NotImplementedError(`Remove user from service end point not configured [user=${userId}] [service=${serviceId}]`)
  }

  const resetUserSecondFactor = function resetUserSecondFactor(id) {
    const path = `/v1/api/users/${id}/reset-second-factor`
    return axiosInstance.post(path).then(utilExtractData)
  }

  const adminEmailsForGatewayAccounts = function adminEmailsForGatewayAccounts(gatewayAccountIds) {
    const path = '/v1/api/users/admin-emails-for-gateway-accounts'
    const request = { 'gatewayAccountIds': gatewayAccountIds }
    const response = axiosInstance.post(path, request)
    return response.then(utilExtractData)
  }

  const services = function services() {
    const path = '/v1/api/services/list'
    return axiosInstance.get(path).then(utilExtractData)
  }

  const serviceUsers = function serviceUsers(id) {
    const path = `/v1/api/services/${id}/users`
    return axiosInstance.get(path)
      .then(utilExtractData)
      .then((users) => users.map(redactOtp))
  }

  const gatewayAccountServices = function gatewayAccountServices(id) {
    return axiosInstance.get(`/v1/api/services?gatewayAccountId=${id}`)
      .then(utilExtractData)
      .catch(handleNotFound('Services for gateway account ', id))
  }

  const serviceStripeAgreement = function serviceStripeAgreement(serviceExternalId) {
    return axiosInstance.get(`/v1/api/services/${serviceExternalId}/stripe-agreement`)
      .then(utilExtractData)
      .catch(handleNotFound('Service Stripe agreement for service ', serviceExternalId))
  }

  const updateServiceBranding = function updateServiceBranding(id, imageUrl, cssUrl) {
    const path = `/v1/api/services/${id}`
    const payload = {
      op: 'replace',
      path: 'custom_branding',
      value: { image_url: imageUrl, css_url: cssUrl }
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const updateServiceGatewayAccount = function updateServiceGatewayAccount(id, accountId) {
    const path = `/v1/api/services/${id}`
    const payload = {
      op: 'add',
      path: 'gateway_account_ids',
      value: [ accountId.toString() ]
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const updateServiceDetails = function updateServiceDetails(id, isUpdateServiceToLive, sector, internalFlag,) {
    const path = `v1/api/services/${id}`
    const payload = [
      {
        op: 'replace',
        path: 'internal',
        value: internalFlag
      },
      {
        op: 'replace',
        path: 'sector',
        value: sector
      }
    ]

    if (isUpdateServiceToLive){
      payload.push(
        {
          op: 'replace',
          path: 'current_go_live_stage',
          value: 'LIVE'
        },
        {
          op: 'replace',
          path: 'went_live_date',
          value: moment.utc().format()
        }
      )
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const updateServiceTestPspAccountStageToCreated = function updateServiceTestPspAccountStageToCreated(id) {
    const path = `v1/api/services/${id}`
    const payload = {
      op: 'replace',
      path: 'current_psp_test_account_stage',
      value: 'CREATED'
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const updateServiceOrganisationName = function updateServiceOrganisationName(id, status) {
    const path = `v1/api/services/${id}`
    const payload = {
      op: 'replace',
      path: 'merchant_details/name',
      value: status
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const toggleTerminalStateRedirectFlag = async function toggleTerminalStateRedirectFlag(
    id
  ) {
    const path = `v1/api/services/${id}`
    const targetService = await service(id)

    const payload = {
      op: 'replace',
      path: 'redirect_to_service_immediately_on_terminal_state',
      value: !targetService.redirect_to_service_immediately_on_terminal_state
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const toggleExperimentalFeaturesEnabledFlag = async function toggleExperimentalFeaturesEnabledFlag(serviceId) {
    const path = `v1/api/services/${serviceId}`
    const targetService = await service(serviceId)

    const payload = {
      op: 'replace',
      path: 'experimental_features_enabled',
      value: !targetService.experimental_features_enabled
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const toggleAgentInitiatedMotoEnabledFlag = async function toggleAgentInitiatedMotoEnabledFlag(serviceId) {
    const path = `v1/api/services/${serviceId}`
    const targetService = await service(serviceId)

    const payload = {
      op: 'replace',
      path: 'agent_initiated_moto_enabled',
      value: !targetService.agent_initiated_moto_enabled
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  const toggleArchiveService = async function toggleArchiveService(serviceId) {
    const path = `v1/api/services/${serviceId}`
    const targetService = await service(serviceId)

    const payload = {
      op: 'replace',
      path: 'archived',
      value: !targetService.archived
    }
    return axiosInstance.patch(path, payload).then(utilExtractData)
  }

  return {
    user,
    findUser,
    service,
    services,
    serviceUsers,
    serviceStripeAgreement,
    searchServices,
    updateServiceBranding,
    updateServiceGatewayAccount,
    gatewayAccountServices,
    updateServiceDetails,
    updateServiceOrganisationName,
    updateServiceTestPspAccountStageToCreated,
    updateUserPhone,
    updateUserEmail,
    toggleUserEnabled,
    removeUserFromService,
    resetUserSecondFactor,
    toggleTerminalStateRedirectFlag,
    toggleExperimentalFeaturesEnabledFlag,
    toggleAgentInitiatedMotoEnabledFlag,
    adminEmailsForGatewayAccounts,
    toggleArchiveService
  }
}

module.exports = adminUsersMethods
