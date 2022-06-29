import {
  CardBrandLabel,
  State,
  ExternalTransactionState,
  TransactionType,
  Language,
  TransactionSource,
  PaymentProvider,
  ResourceType,
  CardBrand,
  ExternalPayoutState,
  TransactionState
} from '../../shared'

export interface BillingAddress {
  line1: string;
  line2?: string;
  postcode: string;
  city: string;
  country: string;
}

export interface RefundSummary {
  status: string;
  user_external_id?: string;
  amount_available: number;
  amount_submitted: number;
  amount_refunded: number;
}

export interface SettlementSummary {
  capture_submit_time?: string;
  captured_date?: string;
}

export interface CardDetails {
  cardholder_name: string;
  billing_address?: BillingAddress;
  card_brand: CardBrandLabel;
  last_digits_card_number: string;
  first_digits_card_number: string;
}

export interface Transaction {
  transaction_id: string;
  reference: string;
  gateway_account_id: string;
  amount: number;
  created_date: string;
  state: State<ExternalTransactionState>;
  transaction_type: TransactionType;
  parent_transaction_id?: string;
}

export interface Payment extends Transaction {
  description: string;
  language: Language;
  source: TransactionSource;
  return_url: string;
  payment_provider: PaymentProvider;
  refund_summary: RefundSummary;
  settlement_summary: SettlementSummary;
  live: boolean;
  moto?: boolean;
  delayed_capture?: boolean;
  card_details?: CardDetails;
  email?: string;
  total_amount?: number;
  fee?: number;
  net_amount?: number;
}

export interface Refund extends Transaction {
  /** External user ID of the user that requested the refund */
  refunded_by?: string;
  refunded_by_user_email?: string;
  gateway_payout_id?: string;
}

export interface PaymentCountByStateReport {
  timedout: number;
  submitted: number;
  declined: number;
  created: number;
  success: number;
  cancelled: number;
  started: number;
  error: number;
  undefined: number;
  capturable: number;
}

export interface ReportCountEntry {
  count: number;
  gross_amount: number;
}

export interface TransactionSummaryReport {
  payments: ReportCountEntry;
  moto_payments: ReportCountEntry;
  refunds: ReportCountEntry;
  net_income: number;
}

export interface TransactionsByHourSegment {
  timestamp: string;
  all_payments: number;
  errored_payments: number;
  completed_payments: number;
  amount: number;
  net_amount: number;
  total_amount: number;
  fee: number;
}

export type TransactionsByHourReport = TransactionsByHourSegment[]

export interface PerformanceReport {
  total_volume: number;
  total_amount: number;
  average_amount: number;
}

export interface GatewayPerformanceReportEntry {
  gateway_account_id: number;
  total_volume: number;
  average_amount: number;
  minimum_amount: number;
  maximum_amount: number;
  month: number;
  year: number;
}

export interface Event {
  amount: number;
  state: State<ExternalTransactionState>;
  resource_type: ResourceType;
  event_type: string;
  timestamp: string;
  data: { [key: string]: string };
}

export interface EventTicker {
  resource_type: ResourceType;
  resource_external_id: string;
  event_date: string;
  event_type: string;
  transaction_type: TransactionType;
  payment_provider: PaymentProvider;
  gateway_account_id: string;
  amount: number;
  card_brand?: CardBrand;
}

export interface Payout {
  amount: number;
  created_date: string;
  gateway_payout_id: string;
  gateway_account_id: string;
  state: State<ExternalPayoutState>,
  paid_out_date?: string;
}

export type GatewayPerformanceReport = GatewayPerformanceReportEntry[]

export interface TransactionsByHourRequest {
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  from_date: string;
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  to_date: string;
}

export interface TransactionSummaryRequest {
  to_date?: string;
  /** moto_payments report entry will be returned with 0 values unless this is set to true. */
  include_moto_statistics?: boolean;
}

export interface TransactionSummaryWithAccountOverrideRequest extends TransactionSummaryRequest {
  override_account_id_restriction: boolean;
  override_from_date_validation: boolean;
}

export interface TransactionSummaryForAccountRequest extends TransactionSummaryRequest {
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  from_date: string;
  account_id: number;
}

export interface PaymentsByStateRequest {
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  from_date?: string;
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  to_date?: string;
}

export interface PaymentsByStateWithAccountOverrideRequest extends PaymentsByStateRequest {
  override_account_id_restriction: boolean;
}

export interface PaymentsByStateForAccountRequest extends PaymentsByStateRequest {
  account_id: number;
}

export interface PerformanceReportRequest {
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  from_date: string;
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  to_date: string;
  state?: TransactionState
}

export interface GatewayPerformanceReportRequest {
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  from_date: string;
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  to_date: string;
}

export interface RetrieveTransactionForAccountRequest {
  account_id: number;
}

export interface RetrieveTransactionWithAccountOverrideRequest {
  override_account_id_restriction: boolean;
  account_id?: number;
}

export interface ListTransactionRequest {
  page?: number;
  display_size?: number;
  cardholder_name?: string;
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  from_date?: string;
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  to_date?: string;
  email?: string;
  reference?: string;
  last_digits_card_number?: string;
  first_digits_card_number?: string;
  state?: ExternalTransactionState;
  payment_states?: ExternalTransactionState | ExternalTransactionState[];
  refund_states?: ExternalTransactionState | ExternalTransactionState[];
  card_brands?: CardBrand | CardBrand[];
  gateway_payout_id?: string;
  gateway_transaction_id?: string;
  /**
   * If the reference filter should check for the value in the reference or should
   * require it to exactly equal the reference.
  */
  exact_reference_match?: boolean;
  /**
   * If the transaction has a parent, should the search also match on the values
   * of the parent transaction.
  */
  with_parent_transaction?: boolean;
}

export interface ListTransactionForAccountRequest extends ListTransactionRequest {
  account_id: number | number[];
}

export interface ListTransactionRequestWithAccountOverrideRequest extends ListTransactionRequest {
  override_account_id_restriction: boolean;
  account_id?: number | number[];
}

export interface ListPaymentRefundsRequest {
  gateway_account_id: number;
}

export interface ListPaymentRefundsResponse {
  parent_transaction_id: string;
  transactions: Refund[];
}

export interface ListTransactionEventsRequest {
  gateway_account_id: number;
  /**
   * Do not filter events. By default (false) events are filtered for the self
   * service view, only showing certain events for backward compatability. Including
   * all events will return everything that made up the transaction in Ledger.
   */
  include_all_events: boolean;
}

export interface ListTransactionEventsResponse {
  transaction_id: string;
  events: Event[];
}

export interface ListEventTickerRequest {
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  from_date: string;
  /** simplified extended ISO format (ISO 8601). YYYY-MM-DDTHH:mm:ss.sssZ. Dates will be registered as UTC. */
  to_date: string;
}

export interface ListPayoutRequest {
  page?: number;
  display_size?: number;
  state?: ExternalPayoutState;
}

export interface ListPayoutForAccountRequest extends ListPayoutRequest {
  gateway_account_id: number | number[];
}

export interface ListPayoutWithAccountOverrideRequest extends ListPayoutRequest {
  override_account_id_restriction: boolean;
  gateway_account_id?: number | number[];
}