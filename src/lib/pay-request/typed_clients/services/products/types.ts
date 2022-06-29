import { Language } from '../../shared'

export enum ProductStatus {
  Active = 'ACTIVE',
  Inactive = 'INACTIVE'
}

export enum ProductType {
  Demo = 'DEMO',
  Prototype = 'PROTOTYPE',
  Adhoc = 'ADHOC'
}

export enum Rel {
  Self = 'self',
  Pay = 'pay',
  Next = 'next',
  Friendly = 'friendly'
}

export interface ProductLink {
  rel: Rel;
  method: 'GET';
  href: string;
}

export interface Product {
  external_id: string;
  name: string;
  status: ProductStatus;
  type: ProductType;
  gateway_account_id: number;
  reference_enabled: boolean;
  language: Language;
  _links: ProductLink[];
  return_url?: string;
  service_name_path?: string;
  product_name_path?: string;
  reference_label?: string;
  reference_hint?: string;
  price?: number;
  pay_api_token?: string;
  description?: string;
  metadata?: { [key: string]: string | number | boolean };
}

export interface ProductStat {
  payment_count: number;
  last_payment_date: string;
  product: Product;
}

export interface ListProductStatsRequest {
  gatewayAccountId?: number;
}