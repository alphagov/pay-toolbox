export interface GatewayAccountRequest {
  payment_provider: string;

  description: string;

  type: string;

  service_name: string;

  analytics_id: string;

  requires_3ds?: string;

  credentials?: object;
}

export interface GatewayAccount {
  gateway_account_id: number;

  type: string;

  service_name: string;
}
