import { EntityNotFoundError } from '../../errors'
const {
  redactProductTokensFromProducts,
  redactProductTokensFromPaymentLinksWithUsage,
  redactProductTokenFromProduct
} = require('./redact')

const productsMethods = function productsMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = (response) => response.data

  function paymentLinksByGatewayAccount(id) {
    return axiosInstance.get(`/v1/api/gateway-account/${id}/products`)
      .then(utilExtractData)
  }

  function paymentLinksByGatewayAccountAndType(id, productType) {
    const queryParams = {
      params: {
        type: productType
      }
    }
    return axiosInstance.get(`/v1/api/gateway-account/${id}/products`, queryParams)
      .then(utilExtractData)
      .then(redactProductTokensFromProducts)
  }

  function paymentLinksWithUsage(gatewayAccountId) {
    const queryParams = {
      params: {
        ...gatewayAccountId && { gatewayAccountId }
      }
    }
    return axiosInstance.get('/v1/api/stats/products', queryParams)
      .then(utilExtractData)
      .then(redactProductTokensFromPaymentLinksWithUsage)
  }

  function createProduct(createProductRequest) {
    return axiosInstance.post('/v1/api/products', createProductRequest).then(utilExtractData)
  }

  function getProduct(id) {
    return axiosInstance.get(`/v1/api/products/${id}`)
      .then(utilExtractData)
      .then(redactProductTokenFromProduct)
  }

  async function toggleRequireCaptcha(id) {
    const product = await getProduct(id)
    const url = `/v2/api/gateway-account/${product.gateway_account_id}/products/${id}`
    const value = !product.require_captcha
    await axiosInstance.patch(url, [{
      op: 'replace',
      path: 'require_captcha',
      value: value
    }]);
    return value
  }

  async function toggleNewPaymentLinkJourneyEnabled(id) {
    const product = await getProduct(id)
    const url = `/v2/api/gateway-account/${product.gateway_account_id}/products/${id}`
    const value = !product.new_payment_link_journey_enabled
    await axiosInstance.patch(url, [{
      op: 'replace',
      path: 'new_payment_link_journey_enabled',
      value: value
    }]);
    return value
  }

  return {
    paymentLinksByGatewayAccount,
    paymentLinksByGatewayAccountAndType,
    paymentLinksWithUsage,
    createProduct,
    getProduct,
    toggleRequireCaptcha,
    toggleNewPaymentLinkJourneyEnabled
  }
}

module.exports = productsMethods