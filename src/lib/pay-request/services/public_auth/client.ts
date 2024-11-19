import Client from '../../base'
import {
  CreateTokenRequest,
  CreateTokenResponse,
  DeleteTokenRequest,
  DeleteTokenResponse,
  ListTokenRequest,
  ListTokenResponse,
  TokenState
} from './types'
import {App} from '../../shared'

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
        .get(`/v1/frontend/auth/${params.gateway_account_id}`, { params: { state: params.token_state || TokenState.Active } })
        .then(response => client._unpackResponseData<ListTokenResponse>(response));
    },

    create(params: CreateTokenRequest): Promise<CreateTokenResponse | undefined> {
      return client._axios
        .post('/v1/frontend/auth', params)
        .then(response => client._unpackResponseData<CreateTokenResponse>(response))
    },

    delete(params: DeleteTokenRequest): Promise<DeleteTokenResponse | undefined> {
      const data = { token_link: params.token_link }
      return client._axios
        .delete(`/v1/frontend/auth/${params.gateway_account_id}`, { data })
        .then(response => client._unpackResponseData<DeleteTokenResponse>(response));
    }
  }))(this)
}
