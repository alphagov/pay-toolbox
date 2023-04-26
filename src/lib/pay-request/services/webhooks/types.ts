export interface Webhook {
  callback_url: string;
  created_date: string;
  description: string;
  external_id: string;
  live: boolean;
  service_id: string;
  status: string;
  subscriptions: string[];
}

export enum EventType {
  card_payment_started,
  card_payment_succeeded,
  card_payment_captured,
  card_payment_refunded,
  card_payment_failed,
  card_payment_expired
}

export enum DeliveryStatus {
  PENDING, SUCCESSFUL, FAILED, WILL_NOT_SEND
}

export interface DeliveryAttempt {
  created_date: string,
  response_time: number,
  result: string,
  send_at: string,
  status: DeliveryStatus,
  status_code: number
}

export interface WebhookMessage {
  created_date: string,
  event_date: string,
  event_type: EventType,
  external_id: string,
  last_delivery_status: DeliveryStatus,
  latest_attempt: DeliveryAttempt,
  resource_id: string,
  resource_type: string
}

export interface RetrieveWebhookRequest {
  account_id?: string;
  service_id?: string;
}

export interface ListWebhookRequest {
  live: boolean;
}

export interface ListWebhooksForServiceRequest extends ListWebhookRequest {
  service_id: string;
}

export interface ListWebhookMessageRequest {
  page?: number,
  status?: DeliveryStatus
}