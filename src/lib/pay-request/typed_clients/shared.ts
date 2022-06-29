export interface SearchResponse<T> {
    page: number,
    count: number,
    total: number,
    results: T[]
}

export enum PaymentProvider {
  Worldpay = 'worldpay',
  Stripe = 'stripe',
  Smartpay = 'smartpay',
  Epdq = 'epdq',
  Sandbox = 'sandbox'
}

export enum AccountType {
  Live = 'live',
  Test = 'test'
}

export enum TransactionState {
  Undefined = 'UNDEFINED',
  Created = 'CREATED',
  Started = 'STARTED',
  Submitted = 'SUBMITTED',
  Capturable = 'CAPTURABLE',
  Success = 'SUCCESS',
  FailedRejected = 'FAILED_REJECTED',
  FailedExpired = 'FAILED_EXPIRED',
  FailedCancelled = 'FAILED_CANCELLED',
  Cancelled = 'CANCELLED',
  Error = 'ERROR',
  ErrorGateway = 'ERROR_GATEWAY'
}

export enum ExternalPayoutState {
  Undefined = 'undefined',
  InTransit = 'intransit',
  PaidOut = 'paidout',
  Failed = 'failed'
}

export enum ExternalTransactionState {
  Undefined = 'undefined',
  Created = 'created',
  Started = 'started',
  Submitted = 'submitted',
  Capturable = 'capturable',
  Success = 'success',
  Declined = 'declined',
  TimedOut = 'timedout',
  Cancelled = 'cancelled',
  Error = 'error'
}

export enum TransactionErrorCode {
  /** Payment method rejected. P0010. */
  Rejected = 'P0010',
  /** Payment expired. P0020. */
  Expired = 'P0020',
  /** Payment was cancelled by the user. P0030. */
  CancelledByUser = 'P0030',
  /** Payment was cancelled by the service. P0040. */
  CancelledByService = 'P0040',
  /** Payment provider returned an error. P0040. */
  Error = 'P0050'
}

export interface State<T> {
  finished: boolean;
  status: T;
  code?: TransactionErrorCode;
  message?: string;
}

export enum TransactionType {
  Payment = 'PAYMENT',
  Refund = 'REFUND'
}

export enum ResourceType {
  Payment = 'PAYMENT',
  Refund = 'REFUND',
  Payout = 'PAYOUT'
}

export enum TransactionSource {
  CardAPI = 'CARD_API',
  CardPaymentLink = 'CARD_PAYMENT_LINK',
  CardExternalTelephone = 'CARD_EXTERNAL_TELEPHONE'
}

export enum EmailCollectionMode {
  Mandatory = 'MANDATORY',
  Optional = 'OPTIONAL',
  Off = 'OFF'
}

export interface EmailNotifications {
  PAYMENT_CONFIRMED?: {
    version: number;
    enabled: boolean;
    template_body?: string;
  }
  REFUND_ISSUES?: {
    version: number;
    enabled: boolean;
    template_body?: string;
  }
}

export enum CardBrand {
  Visa = 'visa',
  MasterCard = 'master-card',
  AmericanExpress = 'american-express',
  DinersClub = 'diners-club',
  Discover = 'discover',
  Jcb = 'jcb',
  UnionPay = 'unionpay',
  Maestro = 'maestro'
}

export enum CardBrandLabel {
  Visa = 'Visa',
  MasterCard = 'Mastercard',
  AmericanExpress = 'American Express',
  DinersClub = 'Diners Club',
  Discover = 'Discover',
  Jcb = 'Jcb',
  UnionPay = 'Union Pay',
  Maestro = 'Maestro'

}

export enum CardType {
  Debit = 'DEBIT',
  Credit = 'CREDIT'
}

export interface SupportedCard {
  id: string;
  brand: CardBrand;
  label: string;
  type: CardType;
  requires3ds: boolean;
}

export enum Language {
  English = 'en',
  Welsh = 'cy'
}

export type kv = { [key: string ]: string | boolean | undefined }

export enum App {
  Connector = 'CONNECTOR',
  AdminUsers = 'ADMIN_USERS',
  Products = 'PRODUCTS',
  Ledger = 'LEDGER',
  PublicAuth = 'PUBLIC_AUTH'
}