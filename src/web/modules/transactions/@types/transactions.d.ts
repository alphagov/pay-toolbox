declare module 'ledger' {
  export enum CardBrand {
    visa
  }

  export enum PaymentProvider {
    'stripe'
  }

  export enum TransactionStatus {
    success
  }

  interface BillingAddress {
    line1: string;
    line2: string;
    postcode: string;
    city: string;
    country: string;
  }

  interface RefundSummary {
    status: string;
    user_external_id: string;
    amount_available: number;
    amount_submitted: number;
  }

  interface CardDetails {
    cardholder_name: string;
    billing_address: BillingAddress;
    card_brand: CardBrand;
    last_digits_card_number: string;
    first_digits_card_number: string;
  }

  interface TransactionExternalState {
    finished: boolean;
    status: TransactionStatus;
  }

  export interface Transaction {
    gateway_account_id: string;
    amount: number;
    total_amount: number;
    fee: number;
    net_amount: number;
    state: TransactionExternalState;
    description: string;
    reference: string;
    language: string;
    return_url: string;
    email: string;
    payment_provider: PaymentProvider;
    created_date: string;
    card_details: CardDetails;
    delayed_capture: boolean;
    gateway_transaction_id: string;
    refund_summary: RefundSummary;
    transaction_id: string;
    transaction_type: string;
  }

  // @FIXME(sfount) gateway account id should be a number
  export interface Event {
    amount: number,
    gateway_account_id: string
    event_type: string
    resource_external_id: string
    event_date: string
    payment_provider: string
    type: string,
    service_name?: string
    card_brand?: string
    timestamp?: number
    historic?: boolean
    key?: string
  }
}

