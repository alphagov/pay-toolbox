export interface Service {
  id: number;

  external_id: string;

  current_go_live_stage: string;

  current_psp_test_account_stage: string;

  gateway_account_ids: string[];

  redirect_to_service_immediately_on_terminal_state: boolean;

  collect_billing_address: boolean;

  experimental_features_enabled: boolean;

  agent_initiated_moto_enabled: boolean;

  internal: boolean;

  archived: boolean;

  sector: string;

  went_live_date: string;

  created_date: string;

  custom_branding: { 
    [key: string]: any;
   }

  service_name: {
    en: string;
    [key: string]: string;
  };

  merchant_details: {
    name: string;
    address_line1: string;
    address_line2: string;
    address_city: string;
    address_country: string;
    address_postcode: string;
    telephone_number: string;
    email: string;
  };
}

interface Role {
  name: string;
  description: string;
  // permissions: Permission[]
}

interface ServiceRole {
  service: Service;
  role: Role;
}

export interface User {
  service_roles: ServiceRole[];
  role?: string; // role alias if it has been parsed
}

export interface StripeAgreement {
  ip_address: string;
  agreement_time: string;
}
