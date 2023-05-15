import Client from '../../base'
import type {
  ListWebhookMessageRequest,
  ListWebhooksForServiceRequest,
  RetrieveWebhookRequest,
  RetrieveWebhookRequestWithOverride,
  Webhook,
  WebhookMessage
} from './types'
import { App, SearchResponse } from '../../shared'
import { handleEntityNotFound } from '../../utils/error';
import { DeliveryAttempt } from './types';

export default class Webhooks extends Client {
  constructor() {
    super(App.Webhooks)
  }

  webhooks = ((client: Webhooks) => ({
    retrieve(
      id: string,
      params: RetrieveWebhookRequest | RetrieveWebhookRequestWithOverride
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
    },

    retrieveMessage(
      webhookId: string,
      messageId: string
    ): Promise<WebhookMessage | undefined> {
      return client._axios
        .get(`/v1/webhook/${webhookId}/message/${messageId}`)
        .then(response => client._unpackResponseData<WebhookMessage>(response))
        .catch(handleEntityNotFound('Webhook message', messageId))
    },

    listMessageAttempts(
      webhookId: string,
      messageId: string
    ): Promise<DeliveryAttempt[] | undefined> {
      return client._axios
        .get(`/v1/webhook/${webhookId}/message/${messageId}/attempt`)
        .then(response => client._unpackResponseData<DeliveryAttempt[]>(response))
        .catch(handleEntityNotFound('Webhook message', messageId))
    }
  }))(this)
}
