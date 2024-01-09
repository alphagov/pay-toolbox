export enum GoLiveStage {
  NotStarted = 'NOT_STARTED',
  EnteredOrganisationName = 'ENTERED_ORGANISATION_NAME',
  EnteredOrganisationAddress = 'ENTERED_ORGANISATION_ADDRESS',
  ChosenPSPStripe = 'CHOSEN_PSP_STRIPE',
  TermsAgreedStripe = 'TERMS_AGREED_STRIPE',
  TermsAgreedWorldpay = 'TERMS_AGREED_GOV_BANKING_WORLDPAY',
  Denied = 'DENIED',
  Live = 'LIVE'
}

export enum PSPTestAccountStage {
  NotStarted= 'NOT_STARTED',
  RequestSubmitted = 'REQUEST_SUBMITTED',
  Created = 'CREATED'
}

export interface CustomBranding {
  image_url?: string;
  css_url?: string;
}

/** GOV.UK Pay service entity, contains service level configuration. */
export interface Service {
  id: number;
  external_id: string;
  current_go_live_stage: GoLiveStage,
  /** List of gateway accounts that are associated with this service. */
  gateway_account_ids: string[];
  service_name: ServiceName;
  name: string;
  internal: boolean;
  archived: boolean;
  redirect_to_service_immediately_on_terminal_state: boolean;
  collect_billing_address: boolean;
  experimental_features_enabled: boolean;
  agent_initiated_moto_enabled?: boolean;
  merchant_details?: MerchantDetails;
  custom_branding?: CustomBranding;
  sector?: string;
  went_live_date?: string;
  created_date?: string;
  current_psp_test_account_stage: PSPTestAccountStage;
  // _links
}

export interface Permission {
  name: string;
  description: string;
}

export interface Role {
  id: number
  name: string;
  description: string;
  permissions: Permission[]
}

export interface ServiceRole {
  service: Service;
  role: Role;
}

export interface User {
  external_id: string;
  email: string;
  telephone_number: string;
  service_roles: ServiceRole[];
  second_factor: 'SMS' | 'OTP';
  disabled: boolean;
  login_counter: number;
  session_version: number;
  otp_key?: string;
  provisional_otp_key?: string;
  provisional_otp_key_created_at?: string;
  last_logged_in_at?: number;
  // features?: Features;
  // _links
}

export interface ServiceName {
  en: string;
  cy?: string;
}

export interface MerchantDetails {
  name?: string;
  telephone_number?: string;
  address_line1?: string;
  address_line2?: string;
  address_city?: string;
  address_postcode?: string;
  address_country?: string;
  email?: string;
  url?: string;
}

export interface RetrieveUserByEmailRequest {
  email: string;
}

export interface RetrieveServiceByGatewayAccountIdRequest {
  gatewayAccountId: string;
}

export interface UpdateUserRequest {
  disabled?: boolean;
  telephone_number?: string;
  email?: string;
}

export interface UpdateServiceRequest {
  internal?: boolean;
  sector?: string;
  current_go_live_stage?: GoLiveStage;
  went_live_date?: string;
  'merchant_details/name'?: string;
  custom_branding?: CustomBranding;
  /**
   * Gateway account IDs to associate with this service. If the gateway account ID is already associated with another
   * service this will return 409 CONFLICT.
   */
  gateway_account_ids?: string[];
  redirect_to_service_immediately_on_terminal_state?: boolean;
  experimental_features_enabled?: boolean;
  agent_initiated_moto_enabled?: boolean;
  archived?: boolean;
  current_psp_test_account_stage?: PSPTestAccountStage
}

export interface SearchServicesRequest {
  service_name?: string;
  service_merchant_name?: string;
}

export interface SearchServicesResponse {
  name_results: Service[];
  merchant_results: Service[];
}

export interface StripeAgreement {
  agreement_time: string;
  ip_address: string;
}
