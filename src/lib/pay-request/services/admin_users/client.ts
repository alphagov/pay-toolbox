import Client from '../../base'
import {redactOTP} from '../../utils/redact'
import {mapRequestParamsToOperation} from '../../utils/request'
import {
  CreateServiceRequest,
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
import {response} from "express";

type FeatureOperation = 'add' | 'remove'

/**
 * Convenience methods for accessing resource endpoints for the Admin Users
 * service.
 */
export default class AdminUsers extends Client {
  constructor() {
    super(App.AdminUsers)
  }

  services = ((client: AdminUsers) => ({
    create(params: CreateServiceRequest): Promise<Service> {
      return client._axios
          .post('/v1/api/services', params)
          .then(response => client._unpackResponseData<Service>(response));
    },

    retrieve(idOrParams: string | RetrieveServiceByGatewayAccountIdRequest): Promise<Service | undefined> {
      const url = isRetrieveServiceParams(idOrParams)
        ? '/v1/api/services'
        : `/v1/api/services/${idOrParams}`
      const config = isRetrieveServiceParams(idOrParams)
        ? { params: idOrParams } || {}
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
      const addOperations = ['gateway_account_ids']
      const payload = mapRequestParamsToOperation(params, addOperations)

      return client._axios
        .patch(`/v1/api/services/${id}`, payload)
        .then(response => client._unpackResponseData<Service>(response));
    },

    listUsers(id: string, role?: string): Promise<User[] | undefined> {
      let url = `/v1/api/services/${id}/users`
      if (typeof role !== 'undefined') {
        url += `?role=${role}`
      }
      return client._axios
        .get(url)
        .then(response => client._unpackResponseData<User[]>(response));
    },

    removeUser(serviceId: string, userId: string) : Promise<void> {
      return client._axios
        .delete(`/v1/api/toolbox/services/${serviceId}/users/${userId}`)
    }
  }))(this)

  users = ((client: AdminUsers) => ({
    retrieve(id: string): Promise<User | undefined> {
      return client._axios
        .get(`/v1/api/users/${id}`)
        .then(response => new User(response.data))
        .then(user => redactOTP(user))
        .catch(handleEntityNotFound('User', id));
    },

    findByEmail(email: string) : Promise<User | undefined> {
      return client._axios
        .post('/v1/api/users/find', { email: email })
        .then(response => new User(response.data))
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
        .then(response => new User(response.data));
    },

    updateFeatures(
        id: string,
        operation: FeatureOperation,
        value: string
    ): Promise<User | undefined> {
      const payload = {
        path: 'features',
        op: operation,
        value
      }
      return client._axios
          .patch(`/v1/api/users/${id}`, payload)
          .then(response => new User(response.data));
    },

    resetSecondFactor(id: string): Promise<User | undefined> {
      return client._axios
        .post(`/v1/api/users/${id}/reset-second-factor`)
        .then(response => new User(response.data));
    },

    listAdminEmailsForGatewayAccounts(gatewayAccountIds: string[]): Promise<Map<string, string[]> | undefined> {
      const request = { 'gatewayAccountIds': gatewayAccountIds }
      return client._axios
        .post('/v1/api/users/admin-emails-for-gateway-accounts', request)
        .then(response => client._unpackResponseData<Map<string, string[]>>(response))
    },

    assignServiceAndRoleToUser(userExternalId: string, serviceExternalId: string, roleName: string): Promise<User | undefined> {
      const request = { 'service_external_id': serviceExternalId, 'role_name': roleName}
      return client._axios
        .post(`/v1/api/users/${userExternalId}/services`, request)
        .then(response => new User(response.data))
    }
  }))(this)
}

function isRetrieveServiceParams(idOrParams: string | RetrieveServiceByGatewayAccountIdRequest): idOrParams is RetrieveServiceByGatewayAccountIdRequest {
  return (idOrParams as RetrieveServiceByGatewayAccountIdRequest).gatewayAccountId !== undefined
}

function isRetrieveUserParams(idOrParams: string | RetrieveUserByEmailRequest): idOrParams is RetrieveUserByEmailRequest {
  return (idOrParams as RetrieveUserByEmailRequest).email !== undefined
}
