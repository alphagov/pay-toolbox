import Client, {PayHooks} from '../../base'
import {redactProductApiToken, redactProductStatTokens, redactProductTokens} from '../../utils/redact'
import {
  Product,
  ProductStat,
  ListProductStatsRequest,
  ProductType,
  CreateProductRequest, UpdateProductRequest
} from './types'
import {App} from '../../shared'
import {handleEntityNotFound} from "../../utils/error";
import {mapRequestParamsToOperation} from "../../utils/request";

export default class Products extends Client {
  constructor() {
    super(App.Products)
  }

  accounts = ((client: Products) => ({
    /**
     * @param id - Gateway account ID.
     */
    listProducts(id: number): Promise<Product[] | undefined> {
      return client._axios
        .get(`/v1/api/gateway-account/${id}/products`)
        .then(response => client._unpackResponseData<Product[]>(response))
        .then(redactProductTokens);
    },

    /**
     * Fetch the products for a gateway account with the specified product type
     * @param id - Gateway account ID.
     * @param type - Product type
     * @returns A list of product objects
     */
    listProductsByType(id: string, type: ProductType): Promise<Product[] | undefined> {
      return client._axios
        .get(`/v1/api/gateway-account/${id}/products`, {params: {type}})
        .then(response => client._unpackResponseData<Product[]>(response))
        .then(redactProductTokens)
    }
  }))(this)

  products = ((client: Products) => ({
    create(params: CreateProductRequest): Promise<Product | undefined> {
      return client._axios
        .post('/v1/api/products', params)
        .then(response => client._unpackResponseData<Product>(response))
    },

    retrieve(id: string): Promise<Product | undefined> {
      return client._axios
        .get(`/v1/api/products/${id}`)
        .then(response => client._unpackResponseData<Product>(response))
        .then(redactProductApiToken)
        .catch(handleEntityNotFound("Product", id));
    },

    update(id: string, accountId: number, params: UpdateProductRequest): Promise<Product | undefined> {
      const payload = mapRequestParamsToOperation(params)

      return client._axios
        .patch(`/v2/api/gateway-account/${accountId}/products/${id}`, payload)
        .then(response => client._unpackResponseData<Product>(response))
    }
  }))(this)

  reports = ((client: Products) => ({
    listStats(params: ListProductStatsRequest = {}): Promise<ProductStat[] | undefined> {
      return client._axios
        .get('/v1/api/stats/products', {params})
        .then(response => client._unpackResponseData<ProductStat[]>(response))
        .then(redactProductStatTokens);
    }
  }))(this)
}
