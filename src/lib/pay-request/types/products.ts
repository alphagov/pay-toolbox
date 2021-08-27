export interface Product {
  external_id: string;

  name: string;

  status: string;

  type: string;

  gateway_account_id: number;

  reference_enabled: boolean;

  reference_label: string;

  language: string;

  require_captcha: boolean;
}
