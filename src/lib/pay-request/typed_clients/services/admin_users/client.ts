import Client, { PayHooks } from '../../base'
import { redactOTP } from '../../utils/redact'
import { mapRequestParamsToOperation } from '../../utils/request'
import {
  User,
  Service,
  RetrieveServiceByGatewayAccountIdRequest,
  UpdateServiceRequest,
  RetrieveUserByEmailRequest,
  UpdateUserUsernameRequest,
  UpdateUserDisabledRequest,
  UpdateUserTelephoneNumberRequest
} from './types'
import { App } from '../../shared'

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
    }
  }))(this)

  users = ((client: AdminUsers) => ({
    retrieve(idOrParams: string | RetrieveUserByEmailRequest): Promise<User | undefined> {
      const action = isRetrieveUserParams(idOrParams)
        ? client._axios.post('/v1/api/users/find', { username: idOrParams.email })
        : client._axios.get(`/v1/api/users/${idOrParams}`)

      return action
        .then(response => client._unpackResponseData<User>(response))
        .then(user => redactOTP(user));
    },

    /**
     * Update user with a given external ID. This route only accepts one change
     * at a time.
     *
     * @param id - User external ID
     */
    update(
      id: string,
      params: UpdateUserUsernameRequest | UpdateUserDisabledRequest | UpdateUserTelephoneNumberRequest
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
      const request = { 'gatewayAccountIds': gatewayAccountIds }
      return client._axios
        .post('/v1/api/users/admin-emails-for-gateway-accounts', request)
        .then(response => client._unpackResponseData<Map<string, string[]>>(response))
    }
  }))(this)
}

function isRetrieveServiceParams(idOrParams: string | RetrieveServiceByGatewayAccountIdRequest): idOrParams is RetrieveServiceByGatewayAccountIdRequest {
  return (idOrParams as RetrieveServiceByGatewayAccountIdRequest).gatewayAccountId !== undefined
}

function isRetrieveUserParams(idOrParams: string | RetrieveUserByEmailRequest): idOrParams is RetrieveUserByEmailRequest {
  return (idOrParams as RetrieveUserByEmailRequest).email !== undefined
}