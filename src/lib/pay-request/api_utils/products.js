import { EntityNotFoundError } from '../../errors'
const { redactProductTokensFromProducts, redactProductTokensFromPaymentLinksWithUsage } = require('./redact')

const productsMethods = function productsMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = (response) => response.data

  const paymentLinksByGatewayAccount = function paymentLinksByGatewayAccount(id) {
    return axiosInstance.get(`/v1/api/gateway-account/${id}/products`)
      .then(utilExtractData)
  }

  const paymentLinksByGatewayAccountAndType = function paymentLinksByGatewayAccountAndType(id, productType) {
    const queryParams = {
      params: {
        type: productType
      }
    }
    return axiosInstance.get(`/v1/api/gateway-account/${id}/products`, queryParams)
      .then(utilExtractData)
      .then(redactProductTokensFromProducts)
   }

  const paymentLinksWithUsage = function paymentLinksWithUsage(gatewayAccountId) {
    const queryParams = {
      params: {
        ...gatewayAccountId && { gatewayAccountId }
      }
    }
    return axiosInstance.get('/v1/api/stats/products', queryParams)
      .then(utilExtractData)
      .then(redactProductTokensFromPaymentLinksWithUsage)
  }

  const createProduct = function createProduct(createProductRequest) {
    return axiosInstance.post('/v1/api/products', createProductRequest).then(utilExtractData)
  }

  return {
    paymentLinksByGatewayAccount,
    paymentLinksByGatewayAccountAndType,
    paymentLinksWithUsage,
    createProduct
  }
}

module.exports = productsMethods