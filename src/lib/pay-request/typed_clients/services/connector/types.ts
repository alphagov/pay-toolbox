import {
    PaymentProvider,
    AccountType,
    EmailCollectionMode,
    EmailNotifications,
    SupportedCard
} from '../../shared'

/** In-flight payment */
export interface Charge {
  charge_id: string;
  /** The amount of the charge, in pence. */
  amount: number;
  /** Amount including all surcharges, in pence. */
  total_amount: number;
  /** Processing fee in pence. Only available depending on payment service provider. */
  fee: number;
  /** Amount including all surcharges and less all fees, in pence. Only available depending on payment service provider. */
  net_amount: number;
  description: string;
  reference: string;
  payment_provider: PaymentProvider;
  card_brand?: string;
  gateway_transaction_id?: string;
  email?: string;
}

export interface GatewayAccount {
  gateway_account_id: number;
  payment_provider: PaymentProvider;
  type: AccountType;
  description: string;
  service_name: string;
  analytics_id: string;
  corporate_credit_card_surcharge_amount: number;
  corporate_debit_card_surcharge_amount: number;
  corporate_prepaid_credit_card_surcharge_amount: number;
  corporate_prepaid_debit_card_surcharge_amount: number;
  allow_apple_pay: boolean;
  allow_google_pay: boolean;
  block_prepaid_cards: boolean;
  /** Gateway account has 3ds enabled */
  toggle_3ds: boolean;
  allow_zero_amount: boolean;
  integration_version_3ds: number;
  allow_moto: boolean;
  email_collection_mode?: EmailCollectionMode,
  email_notifications: EmailNotifications
}

export interface StripeCredentials {
  stripe_account_id: string;
}

export interface Credentials {
  merchant_id: string;
  username: string;
}

export interface GatewayAccountFrontend extends GatewayAccount {
  credentials: StripeCredentials | Credentials;
  live: boolean;
  /** Gateway account has 3ds enabled */
  requires3ds: boolean;
  sendPayerIpAddressToGateway: boolean;
  version: number;

  // notificationCredentials
  // notifySettings
}

export interface GatewayAccountAPI extends GatewayAccount {
  /** Gateway account has 3ds enabled */
  toggle_3ds: boolean;

  // _links: PayLinks
}

export interface NotifySettings {
  api_token: string;
  template_id: string;
  refund_issued_template_id: string;
}

export interface UpdateGatewayAccountBlockPrepaidCardsRequest {
  block_prepaid_cards: boolean;
}

export interface UpdateGatewayAccountNotifySettingsRequest {
  notify_settings: NotifySettings;
}

export interface UpdateGatewayAccountAllowMotoRequest {
  allow_moto: boolean;
}

export interface CreateGatewayAccountRequest {
  type: AccountType;
  payment_provider: PaymentProvider;
  service_name: string;
  description: string;
  credentials?: Credentials | StripeCredentials;
  analytics_id?: string;
  requires_3ds?: boolean;
}

export interface ListCardTypesResponse {
  card_types: SupportedCard[]
}

export interface ListGatewayAccountsRequest {
  moto_enabled?: boolean;
  apple_pay_enabled?: boolean;
  google_pay_enabled?: boolean;
  requires_3ds?: boolean;
  type?: AccountType;
  payment_provider?: PaymentProvider;
}

export interface ListGatewayAccountsResponse {
  accounts: GatewayAccount[]
}

/**
 * Connector only responds with the directly parsed gateway account entity rather
 * than any of the api/ frontend formats
 */
export interface CreateGatewayAccountResponse {
  type: AccountType;
  service_name: string;
  description: string;
  requires_3ds: boolean;
  analytics_id?: string;
  gateway_account_id?: string;
}