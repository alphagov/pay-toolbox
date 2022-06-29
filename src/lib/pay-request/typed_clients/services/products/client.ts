import Client, { PayHooks } from '../../base'
import { redactProductStatTokens, redactProductTokens } from '../../utils/redact'
import {
  Product,
  ProductStat,
  ListProductStatsRequest
} from './types'
import { App } from '../../shared'

export default class Products extends Client {
  constructor(baseUrl: string, options: PayHooks) {
    super(baseUrl, App.Products, options)
  }

  accounts = ((client: Products) => ({
    /**
     * @param id - Gateway account ID.
     */
    listProducts(id: number): Promise<Product[] | undefined> {
      return client._axios
        .get(`/v1/api/gateway-account/${id}/products`)
        .then(response => client._unpackResponseData<Product[]>(response))
        .then(redactProductTokens)
        .catch(client._unpackErrorResponse)
    }
  }))(this)

  reports = ((client: Products) => ({
    listStats(params: ListProductStatsRequest = {}): Promise<ProductStat[] | undefined> {
      return client._axios
        .get('/v1/api/stats/products', { params })
        .then(response => client._unpackResponseData<ProductStat[]>(response))
        .then(redactProductStatTokens)
        .catch(client._unpackErrorResponse)
    }
  }))(this)
}