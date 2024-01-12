import Client from '../../base'
import {redactOTP} from '../../utils/redact'
import {mapRequestParamsToOperation} from '../../utils/request'
import {
  RetrieveServiceByGatewayAccountIdRequest,
  RetrieveUserByEmailRequest,
  SearchServicesRequest,
  SearchServicesResponse,
  Service,
  StripeAgreement,
  UpdateServiceRequest, UpdateUserRequest,
  User
} from './types'
import {App} from '../../shared'
import {handleEntityNotFound} from "../../utils/error";

/**
 * Convenience methods for accessing resource endpoints for the Admin Users
 * service.
 */
export default class AdminUsers extends Client {
  constructor() {
    super(App.AdminUsers)
  }

  services = ((client: AdminUsers) => ({
    retrieve(idOrParams: string | RetrieveServiceByGatewayAccountIdRequest): Promise<Service | undefined> {
      const url = isRetrieveServiceParams(idOrParams)
        ? '/v1/api/services'
        : `/v1/api/services/${idOrParams}`
      const config = isRetrieveServiceParams(idOrParams)
        ? {params: idOrParams} || {}
        : {}
      return client._axios
        .get(url, config)
        .then(response => client._unpackResponseData<Service>(response));
    },

    list(): Promise<Service[] | undefined> {
      return client._axios
        .get('/v1/api/services/list')
        .then(response => client._unpackResponseData<Service[]>(response));
    },

    search(params: SearchServicesRequest): Promise<SearchServicesResponse | undefined> {
      return client._axios
        .post('/v1/api/services/search', params)
        .then(response => client._unpackResponseData<SearchServicesResponse>(response));
    },

    retrieveStripeAgreement(id: string): Promise<StripeAgreement | undefined> {
      return client._axios
        .get(`/v1/api/services/${id}/stripe-agreement`)
        .then(response => client._unpackResponseData<StripeAgreement>(response))
    },

    /**
     * Update service with a given external ID. This routes accepts any number
     * of updates.
     *
     * @param id - Service external ID.
     */
    update(
      id: string,
      params: UpdateServiceRequest
    ): Promise<Service | undefined> {
      // @TODO(sfount) temporary method of having a uniform `update` method on services, this should be a much clearer
      //               pattern for devs to understand what's going on under the hood
      const addOperations = ['gateway_account_ids']
      const payload = mapRequestParamsToOperation(params, addOperations)

      return client._axios
        .patch(`/v1/api/services/${id}`, payload)
        .then(response => client._unpackResponseData<Service>(response));
    },

    listUsers(id: string): Promise<User[] | undefined> {
      return client._axios
        .get(`/v1/api/services/${id}/users`)
        .then(response => client._unpackResponseData<User[]>(response));
    },

    removeUser(serviceId: string, userId: string): Promise<void> {
      return client._axios
        .delete(`/v1/api/toolbox/services/${serviceId}/users/${userId}`)
    }
  }))(this)

  users = ((client: AdminUsers) => ({
    retrieve(id: string): Promise<User | undefined> {
      return client._axios
        .get(`/v1/api/users/${id}`)
        .then(response => client._unpackResponseData<User>(response))
        .then(user => redactOTP(user))
        .catch(handleEntityNotFound('User', id));
    },

    findByEmail(email: string): Promise<User | undefined> {
      return client._axios
        .post('/v1/api/users/find', {email: email})
        .then(response => client._unpackResponseData<User>(response))
        .then(user => redactOTP(user))
        .catch(handleEntityNotFound('User', email));
    },

    /**
     * Update user with a given external ID. This route only accepts one change
     * at a time.
     *
     * @param id - User external ID
     */
    update(
      id: string,
      params: UpdateUserRequest
    ): Promise<User | undefined> {
      const payload = mapRequestParamsToOperation(params).pop()

      return client._axios
        .patch(`/v1/api/users/${id}`, payload)
        .then(response => client._unpackResponseData<User>(response));
    },

    resetSecondFactor(id: string): Promise<User | undefined> {
      return client._axios
        .post(`/v1/api/users/${id}/reset-second-factor`)
        .then(response => client._unpackResponseData<User>(response));
    },

    listAdminEmailsForGatewayAccounts(gatewayAccountIds: string[]): Promise<Map<string, string[]> | undefined> {
      const request = {'gatewayAccountIds': gatewayAccountIds}
      return client._axios
        .post('/v1/api/users/admin-emails-for-gateway-accounts', request)
        .then(response => client._unpackResponseData<Map<string, string[]>>(response))
    },
    updateGlobalRole(userExternalId: string, roleName: string) {
      const request = {'role_name': roleName}
      return client._axios
        .put(`/v1/api/users/${userExternalId}/roles`, request)
        .then(response => client._unpackResponseData<User>(response))
    },
    deleteGlobalRole(userExternalId: string) {
      return client._axios
        .delete(`/v1/api/users/${userExternalId}/roles`)
        .then(response => client._unpackResponseData<User>(response))
    }
  }))(this)
}

function isRetrieveServiceParams(idOrParams: string | RetrieveServiceByGatewayAccountIdRequest): idOrParams is RetrieveServiceByGatewayAccountIdRequest {
  return (idOrParams as RetrieveServiceByGatewayAccountIdRequest).gatewayAccountId !== undefined
}

function isRetrieveUserParams(idOrParams: string | RetrieveUserByEmailRequest): idOrParams is RetrieveUserByEmailRequest {
  return (idOrParams as RetrieveUserByEmailRequest).email !== undefined
}
