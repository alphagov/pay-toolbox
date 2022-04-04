export interface GatewayAccountRequest {
  payment_provider: string;

  description: string;

  type: string;

  service_name: string;

  analytics_id: string;

  requires_3ds?: string;

  credentials?: object;

  sector: string,

  internalFlag: boolean,

  service_id: string
}

export interface GatewayAccount {
  gateway_account_id: string;

  type: string;

  service_name: string;

  payment_provider: string;

  description: string;

  analytics_id: string;

  allow_google_pay: boolean;

  allow_apple_pay: boolean;

  allow_zero_amount: boolean;

  block_prepaid_cards: boolean;

  allow_moto: boolean;

  send_payer_ip_address_to_gateway: boolean;

  integration_version_3ds: number;

  corporate_prepaid_debit_card_surcharge_amount: number;

  corporate_credit_card_surcharge_amount: number;

  corporate_debit_card_surcharge_amount: number;

  gateway_account_credentials: GatewayAccountCredential[]

  email_notifications: {
    [key: string]: EmailNotificationSettings;
  };

  notify_settings: {
    [key: string]: any;
   }
}

export interface Credentials {
  stripe_account_id?: string;
}

export interface GatewayAccountCredential {
  external_id: string;

  payment_provider: string;

  state: string;

  credentials: Credentials;
}

export interface EmailNotificationSettings {
  version: number;

  enabled: boolean;
}

export interface StripeSetup {
  [task: string]: boolean;
}
