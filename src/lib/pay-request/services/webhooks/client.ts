import Client from '../../base'
import type { ListWebhooksForServiceRequest, Webhook } from './types'
import { SearchResponse, App } from '../../shared'

export default class Webhooks extends Client {
  constructor() {
    super(App.Webhooks)
  }

  webhooks = ((client: Webhooks) => ({
    list(
      params: ListWebhooksForServiceRequest
    ): Promise<Webhook[] | undefined> {
    
    return client._axios
      .get('/v1/webhook', {params})
      .then(response => client._unpackResponseData<Webhook[] | undefined >(response));
    }
  }))(this)
}
