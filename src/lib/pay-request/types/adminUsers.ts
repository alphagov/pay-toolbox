export interface Service {
  external_id: string;
  current_go_live_stage: string;

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

export interface StripeAgreement {
  ip_address: string;
  agreement_time: string;
}
