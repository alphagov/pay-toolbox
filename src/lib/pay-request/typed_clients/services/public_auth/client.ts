import Client, { PayHooks } from '../../base'
import {
  ListTokenRequest,
  ListTokenResponse,
  DeleteTokenRequest,
  DeleteTokenResponse
} from './types'
import { App } from '../../shared'

export default class PublicAuth extends Client {
  constructor() {
    super(App.PublicAuth)
  }

  tokens = ((client: PublicAuth) => ({
    /**
     * @param id - Gateway account ID.
     */
    list(params: ListTokenRequest): Promise<ListTokenResponse | undefined> {
      return client._axios
        .get(`/v1/frontend/auth/${params.gateway_account_id}`)
        .then(response => client._unpackResponseData<ListTokenResponse>(response));
    },

    delete(params: DeleteTokenRequest): Promise<DeleteTokenResponse | undefined> {
      const data = { token_link: params.token_link }
      return client._axios
        .delete(`/v1/frontend/auth/${params.gateway_account_id}`, { data })
        .then(response => client._unpackResponseData<DeleteTokenResponse>(response));
    }
  }))(this)
}