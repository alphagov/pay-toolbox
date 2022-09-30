import Client from '../../base'
import { mapRequestParamsToOperation } from '../../utils/request'
import {
  Charge,
  GatewayAccount,
  GatewayAccountAPI,
  GatewayAccountFrontend,
  StripeCredentials,
  ListCardTypesResponse,
  ListGatewayAccountsRequest,
  ListGatewayAccountsResponse,
  CreateGatewayAccountRequest,
  CreateGatewayAccountResponse,
  UpdateGatewayAccountAllowMotoRequest,
  UpdateGatewayAccountBlockPrepaidCardsRequest,
  UpdateGatewayAccountNotifySettingsRequest,
  GatewayStatusComparison
} from './types'
import { App } from '../../shared'

/**
 * Convenience methods for accessing resource endpoints for the Connector
 * service.
 */
export default class Connector extends Client {
  constructor() {
    super(App.Connector)
  }

  charges = ((client: Connector) => ({
    /**
     * Fetch an in-flight payment
     * @param id - Charge external ID
     * @returns In-flight payment object
     */
    retrieve(id: string): Promise<Charge | undefined> {
      return client._axios
        .get(`/v1/frontend/charges/${id}`)
        .then(response => client._unpackResponseData<Charge>(response))
    },

    /**
     * Get the comparison between the status in Pay and the status with the Gateway for a list of
     * charges
     * @param ids - Charge external IDs
     * @returns Array of gateway comparison objects
     */
    getGatewayComparisons(ids: string[]): Promise<GatewayStatusComparison[] | undefined> {
      return client._axios
        .post('/v1/api/discrepancies/report', ids)
        .then(response => client._unpackResponseData<GatewayStatusComparison[]>(response))
    },

    /**
     * Attempts to cancel an authorisation with the payment gateway
     * @param id - Charge external ID
     * @returns Array of gateway comparison objects
     */
    resolveDiscrepancy(id: string): Promise<GatewayStatusComparison[] | undefined> {
      return client._axios
        .post('/v1/api/discrepancies/resolve', [id])
        .then(response => client._unpackResponseData<GatewayStatusComparison[]>(response))
    }
  }))(this)

  accounts = ((client: Connector) => ({
    /**
     * Internal API view for gateway account
     * @param id - Gateway account ID
     * @returns Gateway account object
     */
    retrieveAPI(id: number): Promise<GatewayAccountAPI | undefined> {
      return client._axios
        .get(`/v1/api/accounts/${id}`)
        .then(response => client._unpackResponseData<GatewayAccount>(response))
    },

    /**
     * Frontend view for gateway account
     * @param id - Gateway account ID
     * @returns Gateway account object
     */
    retrieveFrontend(id: number): Promise<GatewayAccountFrontend | undefined> {
      return client._axios
        .get(`/v1/frontend/accounts/${id}`)
        .then(response => client._unpackResponseData<GatewayAccountFrontend>(response))
    },

    /**
     * Fetch Stripe credentials map for a given gateway account. If the gateway
     * account doesn't have Stripe credentials this route will return not found.
     * @param id - Gateway account ID
     * @returns Stripe credentials for a requested gateway account
     */
    retrieveStripeCredentials(id: number): Promise<StripeCredentials | undefined> {
      return client._axios
        .get(`/v1/api/accounts/${id}/stripe-account`)
        .then(response => client._unpackResponseData<StripeCredentials>(response))
    },

    /**
     * List all supported account types currently enabled by the specified gateway
     * account
     * @param id - Gateway account ID
     * @returns List of card types supported by this gateway account
     */
    listCardTypes(id: number): Promise<ListCardTypesResponse | undefined> {
      return client._axios
        .get(`/v1/frontend/accounts/${id}/card-types`)
        .then(response => client._unpackResponseData<ListCardTypesResponse>(response))
    },

    /*
     * List gateway accounts (internal API view)
     * @param filters - optional parameters to filter account list
     * @returns List gateway account response
     */
    list(filters: ListGatewayAccountsRequest = {}): Promise<ListGatewayAccountsResponse | undefined> {
      return client._axios
        .get('/v1/api/accounts', { params: filters})
        .then(response => client._unpackResponseData<ListGatewayAccountsResponse>(response))
    },

    /**
     * Create a new gateway account
     * @param params - Gateway account details
     * @returns The created gateway account object
     */
    create(params: CreateGatewayAccountRequest): Promise<CreateGatewayAccountResponse | undefined> {
      return client._axios
        .post('/v1/api/accounts', params)
        .then(response => client._unpackResponseData<CreateGatewayAccountResponse>(response));
    },

    /**
     * Update an existing gateway account. The patch endpoint for accounts only
     * accepts one operation. The patch endpoint for accounts will respond with
     * an empty success response
     * @param id - Gateway account ID
     * @param params - keys to update on the gateway account
     * @returns The updated gateway account object
     */
    update(
      id: number,
      params: UpdateGatewayAccountAllowMotoRequest | UpdateGatewayAccountBlockPrepaidCardsRequest | UpdateGatewayAccountNotifySettingsRequest
    ): Promise<void | undefined> {
      // @TODO(sfount) move to utility so that it can be unit tested
      const payload = mapRequestParamsToOperation(params).pop()

      return client._axios
        .patch(`/v1/api/accounts/${id}`, payload)
        .then(() => { return });
        // @TODO(sfount) decide if this should return the updated account -- could determine through uses of it
        // .then(() => this.retrieveAPI(id))
    }

  }))(this)

  cardTypes = ((client: Connector) => ({
    /**
     * List all card types supported by the platform
     * @returns List of card types
     */
    list(): Promise<ListCardTypesResponse | undefined> {
      return client._axios
        .get('/v1/api/card-types')
        .then(response => client._unpackResponseData<ListCardTypesResponse>(response));
    }
  }))(this)


  eventEmitter = ((client: Connector) => ({
    emitByIdRange(startId: number, maxId: number, recordType: string, retryDelayInSeconds: number): Promise<void> {
      const params = {
        start_id: startId,
        max_id: maxId,
        record_type: recordType,
        do_not_retry_emit_until: retryDelayInSeconds
      }
      return client._axios
        .post('/v1/tasks/historical-event-emitter', null, { params })
        .then(() => { return })
    },

    emitByDate(startDate: string, endDate: string, retryDelayInSeconds: number): Promise<void> {
      const params = {
        start_date: startDate,
        end_date: endDate,
        do_not_retry_emit_until: retryDelayInSeconds
      }
      return client._axios
        .post('/v1/tasks/historical-event-emitter-by-date', null, { params })
        .then(() => { return })
    }
  }))(this)

  parityChecker = ((client: Connector) => ({
    runParityCheck(
      startId: number,
      maxId: number,
      doNotReprocessValidRecords: boolean,
      parityCheckStatus: string,
      retryDelayInSeconds: number,
      recordType: string) : Promise<void> {
        const params = {
          start_id: startId,
          max_id: maxId,
          do_not_reprocess_valid_records: doNotReprocessValidRecords,
          parity_check_status: parityCheckStatus,
          do_not_retry_emit_until: retryDelayInSeconds,
          record_type: recordType
        }
        return client._axios
        .post('/v1/tasks/parity-checker', null, { params })
        .then(() => { return })
      }
  }))(this)
}
