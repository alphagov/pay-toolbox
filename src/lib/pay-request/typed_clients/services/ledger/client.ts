import Client, { PayHooks } from '../../base'
import type {
  Payment,
  Refund,
  Payout,
  EventTicker,
  PaymentCountByStateReport,
  TransactionSummaryReport,
  TransactionsByHourReport,
  PerformanceReport,
  GatewayPerformanceReport,
  RetrieveTransactionForAccountRequest,
  RetrieveTransactionWithAccountOverrideRequest,
  ListTransactionForAccountRequest,
  ListTransactionRequestWithAccountOverrideRequest,
  ListPaymentRefundsRequest,
  ListTransactionEventsRequest,
  ListEventTickerRequest,
  PaymentsByStateWithAccountOverrideRequest,
  PaymentsByStateForAccountRequest,
  TransactionSummaryWithAccountOverrideRequest,
  TransactionSummaryForAccountRequest,
  PerformanceReportRequest,
  GatewayPerformanceReportRequest,
  ListPayoutForAccountRequest,
  ListPayoutWithAccountOverrideRequest,
  TransactionsByHourRequest,
  ListPaymentRefundsResponse,
  ListTransactionEventsResponse,
} from './types'
import {
  SearchResponse,
  TransactionType,
  ResourceType,
  PaymentProvider,
  App
} from '../../shared'

export default class Ledger extends Client {
  constructor(baseUrl: string, options: PayHooks) {
    super(baseUrl, App.Ledger, options)
  }

  payments = ((client: Ledger) => ({
    /**
     * @param id - GOV.UK Pay transaction external ID
     * @param params - optionally specify gateway account ID or override requirement
     */
    retrieve(
      id: string,
      params: RetrieveTransactionForAccountRequest | RetrieveTransactionWithAccountOverrideRequest
    ): Promise<Payment | undefined> {
      return client._axios
        .get(`/v1/transaction/${id}`, { params })
        .then(response => client._unpackResponseData<Payment>(response))
        .catch(client._unpackErrorResponse)
    },

    list(
      filters: ListTransactionForAccountRequest | ListTransactionRequestWithAccountOverrideRequest
    ): Promise<SearchResponse<Payment> | undefined> {
      const accountIdParam = filters.account_id as number[]
      const paymentFilters: any = {
        ...filters,

        // @TODO(sfount): this is to work around querystring.stringy() not using a comma separated value
        //                method. The library `qs` is probably a safer way to do this
        ...accountIdParam && accountIdParam.length && { account_id: accountIdParam.join(',') },
        transaction_type: TransactionType.Payment
      }
      return client._axios
        .get('/v1/transaction', { params: paymentFilters })
        .then(response => client._unpackResponseData<SearchResponse<Payment>>(response))
        .catch(client._unpackErrorResponse)
    },

    /**
     * @param id - GOV.UK Pay transaction external ID
     * @param params - specify gateway account ID
     */
    listRefunds(id: string, params: ListPaymentRefundsRequest): Promise<ListPaymentRefundsResponse | undefined> {
      return client._axios
        .get(`/v1/transaction/${id}/transaction`, { params })
        .then(response => client._unpackResponseData<ListPaymentRefundsResponse>(response))
        .catch(client._unpackErrorResponse)
    }
  }))(this)

  refunds = ((client: Ledger) => ({
    /**
     * @param id - GOV.UK Pay transaction external ID
     * @param params - optionally specify gateway account ID or override requirement
     */
    retrieve(
      id: string,
      params: RetrieveTransactionForAccountRequest | RetrieveTransactionWithAccountOverrideRequest
    ): Promise<Refund | undefined> {
      return client._axios
        .get(`/v1/transaction/${id}`, { params })
        .then(response => client._unpackResponseData<Refund>(response))
        .catch(client._unpackErrorResponse)
    },

    list(
      filters: ListTransactionForAccountRequest | ListTransactionRequestWithAccountOverrideRequest
    ): Promise<SearchResponse<Refund> | undefined> {
      const accountIdParam = filters.account_id as number[]
      const refundFilters: any = {
        ...filters,
        ...accountIdParam && accountIdParam.length && { account_id: accountIdParam.join(',') },
        transaction_type: TransactionType.Refund
      }

      return client._axios
        .get('/v1/transaction', { params: refundFilters })
        .then(response => client._unpackResponseData<SearchResponse<Refund>>(response))
        .catch(client._unpackErrorResponse)
    }
  }))(this)

  transactions = ((client: Ledger) => ({
    /**
     * @param id - GOV.UK Pay transaction external ID
     * @param params - optionally specify gateway account ID or override requirement
     * @returns - List of events for this transaction and transaction with this
     *            transaction set as their parent transaction
     */
    listEvents(id: string, params: ListTransactionEventsRequest): Promise<ListTransactionEventsResponse | undefined> {
      return client._axios
        .get(`/v1/transaction/${id}/event`, { params })
        .then(response => client._unpackResponseData<ListTransactionEventsResponse>(response))
        .catch(client._unpackErrorResponse)
    }
  }))(this)

  events = ((client: Ledger) => ({
    /**
     * List ticker entries for events on any live transaction
     * @param params
     */
    listTicker(params: ListEventTickerRequest): Promise<EventTicker[] | undefined> {
      return client._axios
        .get('/v1/event/ticker', { params })
        .then(response => client._unpackResponseData<EventTicker[]>(response))

        // @FIXME(sfount) this is to accomidate inconsistent backend behaviour,
        //                it should be removed upstream and then this can be removed
        .then(eventTickers => eventTickers
          .map(event => ({
            ...event,
            resource_type: event.resource_type.toUpperCase() as ResourceType,
            payment_provider: event.payment_provider.replace(/"/g, '') as PaymentProvider
          }))
        )
        .catch(client._unpackErrorResponse)
    }
  }))(this)

  reports = ((client: Ledger) => ({
    retrievePaymentSummaryByState(params: PaymentsByStateWithAccountOverrideRequest | PaymentsByStateForAccountRequest): Promise<PaymentCountByStateReport | undefined> {
      return client._axios
        .get('/v1/report/payments_by_state', { params })
        .then(response => client._unpackResponseData<PaymentCountByStateReport>(response))
        .catch(client._unpackErrorResponse)
    },

    retrieveTransactionSummary(params: TransactionSummaryWithAccountOverrideRequest | TransactionSummaryForAccountRequest): Promise<TransactionSummaryReport | undefined> {
      return client._axios
        .get('/v1/report/transactions-summary', { params })
        .then(response => client._unpackResponseData<TransactionSummaryReport>(response))
        .catch(client._unpackErrorResponse)
    },

    /**
     * Fetch transaction statistics grouped by hour between two dates. Notes this
     * will only return transactions flagged as live.
     * @param params - TransactionsByHourRequest
     * @returns Live transaction statistics grouped by hour
     */
    listTransactionSummaryByHour(params: TransactionsByHourRequest): Promise<TransactionsByHourReport | undefined> {
      return client._axios
        .get('/v1/report/transactions-by-hour', { params })
        .then(response => client._unpackResponseData<TransactionsByHourReport>(response))
        .catch(client._unpackErrorResponse)
    },

    retrievePerformanceSummary(params: PerformanceReportRequest): Promise<PerformanceReport | undefined> {
      return client._axios
        .get('/v1/report/performance-report', { params })
        .then(response => client._unpackResponseData<PerformanceReport>(response))
        .catch(client._unpackErrorResponse)
    },

    retrievePerformanceSummaryByGateway(params: GatewayPerformanceReportRequest): Promise<GatewayPerformanceReport | undefined> {
      return client._axios
        .get('/v1/report/gateway-performance-report', { params })
        .then(response => client._unpackResponseData<GatewayPerformanceReport>(response))
        .catch(client._unpackErrorResponse)
    }
  }))(this)

  payouts = ((client: Ledger) => ({
    list(params: ListPayoutForAccountRequest | ListPayoutWithAccountOverrideRequest): Promise<SearchResponse<Payout> | undefined> {
      const accountIdParam = params.gateway_account_id as number[]
      const payoutParams: any = {
        ...params,
        ...accountIdParam && accountIdParam.length && { gateway_account_id: accountIdParam.join(',') }
      }

      return client._axios
        .get('/v1/payout', { params: payoutParams })
        .then(response => client._unpackResponseData<SearchResponse<Payout>>(response))
        .catch(client._unpackErrorResponse)
    }
  }))(this)
}