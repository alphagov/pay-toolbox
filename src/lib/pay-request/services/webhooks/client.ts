import Client from '../../base'
import type { ListWebhookMessageRequest, ListWebhooksForServiceRequest, RetrieveWebhookRequest, Webhook, WebhookMessage } from './types'
import { App, SearchResponse } from '../../shared'
import { handleEntityNotFound } from '../../utils/error';

export default class Webhooks extends Client {
  constructor() {
    super(App.Webhooks)
  }

  webhooks = ((client: Webhooks) => ({
    retrieve(
      id: string,
      params: RetrieveWebhookRequest
    ): Promise<Webhook | undefined> {
      return client._axios
        .get(`/v1/webhook/${id}`, {params})
        .then(response => client._unpackResponseData<Webhook>(response))
        .catch(handleEntityNotFound('Webhook', id))
    },

    list(
      params: ListWebhooksForServiceRequest
    ): Promise<Webhook[] | undefined> {

    return client._axios
      .get('/v1/webhook', {params})
      .then(response => client._unpackResponseData<Webhook[] | undefined >(response));
    },

    listMessages(
      webhookId: string,
      params: ListWebhookMessageRequest
    ): Promise<SearchResponse<WebhookMessage> | undefined> {
      return client._axios
        .get(`/v1/webhook/${webhookId}/message`, {params})
        .then(response => client._unpackResponseData<SearchResponse<WebhookMessage> | undefined >(response));
    }
  }))(this)
}
