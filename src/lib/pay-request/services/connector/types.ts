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
  gateway_account_id: string;
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
  allow_zero_amount: boolean;
  integration_version_3ds: number;
  allow_moto: boolean;
  allow_telephone_payment_notifications: boolean;
  send_payer_ip_address_to_gateway: boolean;
  send_payer_email_to_gateway: boolean;
  send_reference_to_gateway: boolean;
  email_collection_mode?: EmailCollectionMode,
  email_notifications: EmailNotifications,
  notifySettings: NotifySettings
  disabled: boolean;
  disabled_reason: string;
  allow_authorisation_api: boolean;
  recurring_enabled: boolean;
  provider_switch_enabled: boolean;
  service_id: string;
  worldpay_3ds_flex: Worldpay3dsFlexCredentials;
  gateway_account_credentials: GatewayAccountCredential[];
  live: boolean;
  /** Gateway account has 3ds enabled */
  requires3ds: boolean;
  sendPayerIpAddressToGateway: boolean;
}

export interface GatewayAccountCredential {
  external_id: string;
  payment_provider: string;
  state: string;
  credentials: StripeCredentials | Credentials;
}

export interface StripeCredentials {
  stripe_account_id: string;
}

export interface Credentials {
  merchant_id?: string;
  username?: string;
}

export interface Worldpay3dsFlexCredentials {
  issuer: string;
  organisational_unit_id: string;
  exemption_engine_enabled: boolean;
}

export interface NotifySettings {
  service_id: string,
  api_token: string;
  template_id: string;
  refund_issued_template_id: string;
  email_reply_to_id?: string;
}

export interface UpdateGatewayAccountRequest {
  notify_settings?: NotifySettings;
  block_prepaid_cards?: boolean;
  allow_moto?: boolean;
  worldpay_exemption_engine_enabled?: boolean;
  allow_telephone_payment_notifications?: boolean;
  send_payer_ip_address_to_gateway?: boolean;
  send_payer_email_to_gateway?: boolean;
  send_reference_to_gateway?: boolean;
  disabled?: boolean;
  disabled_reason?: string;
  allow_authorisation_api?: boolean;
  recurring_enabled?: boolean;
  corporate_credit_card_surcharge_amount?: number;
  corporate_debit_card_surcharge_amount?: number;
  corporate_prepaid_debit_card_surcharge_amount?: number;
  provider_switch_enabled?: boolean;
}

export interface CreateGatewayAccountRequest {
  type: AccountType;
  payment_provider: string;
  service_name: string;
  description: string;
  service_id: string;
  credentials?: Credentials | StripeCredentials;
  analytics_id?: string;
  requires_3ds?: boolean;
  allow_apple_pay?: boolean;
  allow_google_pay?: boolean;
}

export interface ListCardTypesResponse {
  card_types: SupportedCard[]
}

export interface ListGatewayAccountsRequest {
  moto_enabled?: string;
  apple_pay_enabled?: string;
  google_pay_enabled?: string;
  requires_3ds?: string;
  type?: AccountType;
  payment_provider?: string;
  payment_provider_account_id?: string;
  provider_switch_enabled?: string;
  serviceIds?: string;
  recurring_enabled?: string;
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
  external_id: string;
}

export interface GatewayStatusComparison {
  payStatus: string;
  payExternalStatus: string;
  gatewayStatus: string;
  chargeId: string;
  rawGatewayResponse: string;
  charge: Charge;
  processed: boolean;
}

export interface StripeSetup {
  [task: string]: boolean;
}

export interface GatewayStatusComparison {
  payStatus: string;
  payExternalStatus: string;
  gatewayStatus: string;
  chargeId: string;
  rawGatewayResponse: string;
  charge: Charge;
  processed: boolean;
}

export interface UpdateStripeSetupRequest {
  bank_account?: boolean;
  responsible_person?: boolean;
  vat_number?: boolean;
  company_number?: boolean;
  director?: boolean;
  government_entity_document?: boolean;
  organisation_details?: boolean;
}

export interface GatewayAccountCredentials {
  active_start_date: string;
  active_end_date: string;
  created_date: string;
  credentials: Credentials | StripeCredentials;
  external_id: string;
  gateway_account_id: number;
  last_updated_by_user_external_id: string;
  payment_provider: string;
  state: string;
}

export interface AddGatewayAccountCredentialsRequest {
  payment_provider: string;
  credentials?: StripeCredentials;
}
