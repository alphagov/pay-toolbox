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

export interface ListWebhookRequest {
  live: boolean;
}

export interface ListWebhooksForServiceRequest extends ListWebhookRequest {
  service_id: string;
}
