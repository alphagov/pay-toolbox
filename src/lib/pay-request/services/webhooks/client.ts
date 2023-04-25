import Client from '../../base'
import type { ListWebhooksForServiceRequest, RetrieveWebhookRequest, Webhook } from './types'
import { App } from '../../shared'
import { handleEntityNotFound } from "../../utils/error";

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
    }
  }))(this)
}
