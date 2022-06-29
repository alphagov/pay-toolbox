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
  constructor(baseUrl: string, options: PayHooks) {
    super(baseUrl, App.AdminUsers, options)
  }

  services = ((client: AdminUsers): {
    /**
     * Get a GOV.UK Pay service by external ID.
     * @param id - External service ID
     * @returns Service entity.
     */
    retrieve(id: string): Promise<Service | undefined>,
    /**
     * Get the GOV.UK Pay service that contains a given Gateway Account ID.
     * @param params - Params to provide gateway account id
     * @returns Service entity.
     */
    retrieve(params: RetrieveServiceByGatewayAccountIdRequest): Promise<Service | undefined>,
    update(id: string, params: UpdateServiceRequest): Promise<Service | undefined>,
    listUsers(id: string): Promise<User[] | undefined>,
    list(): Promise<Service[] | undefined>,
  } => ({
    retrieve(idOrParams: string | RetrieveServiceByGatewayAccountIdRequest): Promise<Service | undefined> {
      const url = isRetrieveServiceParams(idOrParams)
        ? '/v1/api/services'
        : `/v1/api/services/${idOrParams}`
      const config = isRetrieveServiceParams(idOrParams)
        ? { params: idOrParams } || {}
        : {}
      return client._axios
        .get(url, config)
        .then(response => client._unpackResponseData<Service>(response))
        .catch(client._unpackErrorResponse)
    },

    list(): Promise<Service[] | undefined> {
      return client._axios
        .get('/v1/api/services/list')
        .then(response => client._unpackResponseData<Service[]>(response))
        .catch(client._unpackErrorResponse)
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
      const addOperations = [ 'gateway_account_ids' ]
      const payload = mapRequestParamsToOperation(params, addOperations)

      return client._axios
        .patch(`/v1/api/services/${id}`, payload)
        .then(response => client._unpackResponseData<Service>(response))
        .catch(client._unpackErrorResponse)
    },

    listUsers(id: string): Promise<User[] | undefined> {
      return client._axios
        .get(`/v1/api/services/${id}/users`)
        .then(response => client._unpackResponseData<User[]>(response))
        .catch(client._unpackErrorResponse)
    }
  }))(this)

  users = ((client: AdminUsers): {
    retrieve(id: string): Promise<User | undefined>,
    retrieve(params: RetrieveUserByEmailRequest): Promise<User | undefined>,
    update(id: string, params: UpdateUserUsernameRequest | UpdateUserDisabledRequest | UpdateUserTelephoneNumberRequest): Promise<User | undefined>,
    resetSecondFactor(id: string): Promise<User | undefined>
  } => ({
    retrieve(idOrParams: string | RetrieveUserByEmailRequest): Promise<User | undefined> {
      const action = isRetrieveUserParams(idOrParams)
        ? client._axios.post('/v1/api/users/find', { username: idOrParams.email })
        : client._axios.get(`/v1/api/users/${idOrParams}`)

      return action
        .then(response => client._unpackResponseData<User>(response))
        .then(user => { console.log('redact otp'); return redactOTP(user) })
        .catch(client._unpackErrorResponse)
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
        .then(response => client._unpackResponseData<User>(response))
        .catch(client._unpackErrorResponse)
    },

    resetSecondFactor(id: string): Promise<User | undefined> {
      return client._axios
        .post(`/v1/api/users/${id}/reset-second-factor`)
        .then(response => client._unpackResponseData<User>(response))
        .catch(client._unpackErrorResponse)
    }
  }))(this)
}

function isRetrieveServiceParams(idOrParams: string | RetrieveServiceByGatewayAccountIdRequest): idOrParams is RetrieveServiceByGatewayAccountIdRequest {
  return (idOrParams as RetrieveServiceByGatewayAccountIdRequest).gatewayAccountId !== undefined
}

function isRetrieveUserParams(idOrParams: string | RetrieveUserByEmailRequest): idOrParams is RetrieveUserByEmailRequest {
  return (idOrParams as RetrieveUserByEmailRequest).email !== undefined
}