import Client, {PayHooks} from '../../base'
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
  ListAgreementForAccountRequest,
  ListAgreementRequestWithAccountOverrideRequest,
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
  Transaction, 
  RelatedTransactionsRequest, 
  TransactionsForTransactionResponse,
  Agreement
} from './types'
import {
  SearchResponse,
  TransactionType,
  ResourceType,
  PaymentProvider,
  App
} from '../../shared'
import {handleEntityNotFound} from "../../utils/error";

export default class Ledger extends Client {
  constructor() {
    super(App.Ledger)
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
        .get(`/v1/transaction/${id}`, {params})
        .then(response => client._unpackResponseData<Payment>(response));
    },

    list(
      filters: ListTransactionForAccountRequest | ListTransactionRequestWithAccountOverrideRequest
    ): Promise<SearchResponse<Payment> | undefined> {
      const accountIdParam = filters.account_id as number[]
      const paymentFilters: any = {
        ...filters,

        // @TODO(sfount): this is to work around querystring.stringy() not using a comma separated value
        //                method. The library `qs` is probably a safer way to do this
        ...accountIdParam && accountIdParam.length && {account_id: accountIdParam.join(',')},
        transaction_type: TransactionType.Payment
      }
      return client._axios
        .get('/v1/transaction', {params: paymentFilters})
        .then(response => client._unpackResponseData<SearchResponse<Payment>>(response));
    },

    /**
     * @param id - GOV.UK Pay transaction external ID
     * @param params - specify gateway account ID
     */
    listRefunds(id: string, params: ListPaymentRefundsRequest): Promise<ListPaymentRefundsResponse | undefined> {
      return client._axios
        .get(`/v1/transaction/${id}/transaction`, {params})
        .then(response => client._unpackResponseData<ListPaymentRefundsResponse>(response));
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
        .get(`/v1/transaction/${id}`, {params})
        .then(response => client._unpackResponseData<Refund>(response));
    },

    list(
      filters: ListTransactionForAccountRequest | ListTransactionRequestWithAccountOverrideRequest
    ): Promise<SearchResponse<Refund> | undefined> {
      const accountIdParam = filters.account_id as number[]
      const refundFilters: any = {
        ...filters,
        ...accountIdParam && accountIdParam.length && {account_id: accountIdParam.join(',')},
        transaction_type: TransactionType.Refund
      }

      return client._axios
        .get('/v1/transaction', {params: refundFilters})
        .then(response => client._unpackResponseData<SearchResponse<Refund>>(response));
    }
  }))(this)

  transactions = ((client: Ledger) => ({
    retrieve(id: string): Promise<Transaction | undefined> {
      return client._axios
        .get(`/v1/transaction/${id}`, { params: {override_account_id_restriction: true}})
        .then(response => client._unpackResponseData<Transaction>(response))
        .catch(handleEntityNotFound('Transaction', id))
    },

    retrieveRelatedTransactions(id: string, params: RelatedTransactionsRequest): Promise<TransactionsForTransactionResponse | undefined> {
      return client._axios
        .get(`/v1/transaction/${id}/transaction`, {params})
        .then(response => client._unpackResponseData<TransactionsForTransactionResponse>(response));
    },

    list(
      filters: ListTransactionForAccountRequest | ListTransactionRequestWithAccountOverrideRequest
    ): Promise<SearchResponse<Transaction> | undefined> {
      const accountIdParam = filters.account_id as number[]
      const paymentFilters: any = {
        ...filters,

        // @TODO(sfount): this is to work around querystring.stringy() not using a comma separated value
        //                method. The library `qs` is probably a safer way to do this
        ...accountIdParam && accountIdParam.length && {account_id: accountIdParam.join(',')},
        ...Array.isArray(filters.payment_states) && { payment_states: filters.payment_states.join(',') },
        ...Array.isArray(filters.refund_states) && { refund_states: filters.refund_states.join(',') }
      }
      return client._axios
        .get('/v1/transaction', {params: paymentFilters})
        .then(response => client._unpackResponseData<SearchResponse<Transaction>>(response));
    },

    /**
     * @param id - GOV.UK Pay transaction external ID
     * @param params - optionally specify gateway account ID or override requirement
     * @returns - List of events for this transaction and transaction with this
     *            transaction set as their parent transaction
     */
    listEvents(id: string, params: ListTransactionEventsRequest): Promise<ListTransactionEventsResponse | undefined> {
      return client._axios
        .get(`/v1/transaction/${id}/event`, {params})
        .then(response => client._unpackResponseData<ListTransactionEventsResponse>(response));
    }
  }))(this)

  agreements = ((client: Ledger) => ({
    list(
      filters: ListAgreementForAccountRequest | ListAgreementRequestWithAccountOverrideRequest
    ): Promise<SearchResponse<Agreement> | undefined> {
      const accountIdParam = filters.account_id as number[]

      return client._axios
        .get('/v1/agreement', {params: filters})
        .then(response => client._unpackResponseData<SearchResponse<Agreement>>(response));
    },
  }))(this)

  events = ((client: Ledger) => ({
    /**
     * List ticker entries for events on any live transaction
     * @param params
     */
    listTicker(params: ListEventTickerRequest): Promise<EventTicker[] | undefined> {
      return client._axios
        .get('/v1/event/ticker', {params})
        .then(response => client._unpackResponseData<EventTicker[]>(response))

        // @FIXME(sfount) this is to accomidate inconsistent backend behaviour,
        //                it should be removed upstream and then this can be removed
        .then(eventTickers => eventTickers
          .map(event => ({
            ...event,
            resource_type: event.resource_type.toUpperCase() as ResourceType,
            payment_provider: event.payment_provider && event.payment_provider.replace(/"/g, '') as PaymentProvider
          }))
        );
    }
  }))(this)

  reports = ((client: Ledger) => ({
    retrievePaymentSummaryByState(params: PaymentsByStateWithAccountOverrideRequest | PaymentsByStateForAccountRequest): Promise<PaymentCountByStateReport | undefined> {
      return client._axios
        .get('/v1/report/payments_by_state', {params})
        .then(response => client._unpackResponseData<PaymentCountByStateReport>(response));
    },

    retrieveTransactionSummary(params: TransactionSummaryWithAccountOverrideRequest | TransactionSummaryForAccountRequest): Promise<TransactionSummaryReport | undefined> {
      return client._axios
        .get('/v1/report/transactions-summary', {params})
        .then(response => client._unpackResponseData<TransactionSummaryReport>(response));
    },

    /**
     * Fetch transaction statistics grouped by hour between two dates. Notes this
     * will only return transactions flagged as live.
     * @param params - TransactionsByHourRequest
     * @returns Live transaction statistics grouped by hour
     */
    listTransactionSummaryByHour(params: TransactionsByHourRequest): Promise<TransactionsByHourReport | undefined> {
      return client._axios
        .get('/v1/report/transactions-by-hour', {params})
        .then(response => client._unpackResponseData<TransactionsByHourReport>(response));
    },

    retrievePerformanceSummary(params: PerformanceReportRequest): Promise<PerformanceReport | undefined> {
      return client._axios
        .get('/v1/report/performance-report', {params})
        .then(response => client._unpackResponseData<PerformanceReport>(response));
    },

    retrieveLegacyPerformanceSummary(params: PerformanceReportRequest): Promise<PerformanceReport | undefined> {
      return client._axios
        .get('/v1/report/performance-report-legacy', {params})
        .then(response => client._unpackResponseData<PerformanceReport>(response));
    },

    retrievePerformanceSummaryByGateway(params: GatewayPerformanceReportRequest): Promise<GatewayPerformanceReport | undefined> {
      return client._axios
        .get('/v1/report/gateway-performance-report', {params})
        .then(response => client._unpackResponseData<GatewayPerformanceReport>(response));
    }
  }))(this)

  payouts = ((client: Ledger) => ({
    list(params: ListPayoutForAccountRequest | ListPayoutWithAccountOverrideRequest): Promise<SearchResponse<Payout> | undefined> {
      const payoutParams = {
        ...params,
        ...params.gateway_account_id && Array.isArray(params.gateway_account_id) && {gateway_account_id: params.gateway_account_id.join(',')},
      }

      return client._axios
        .get('/v1/payout', {params: payoutParams})
        .then(response => client._unpackResponseData<SearchResponse<Payout>>(response));
    }
  }))(this)
}
