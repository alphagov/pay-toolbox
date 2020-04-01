import { EntityNotFoundError } from '../../errors'

const productsMethods = function productsMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = (response) => response.data

  const paymentLinksByGatewayAccount = function paymentLinksByGatewayAccount(id) {
    return axiosInstance.get(`/v1/api/gateway-account/${id}/products`)
      .then(utilExtractData)
  }

  const paymentLinksWithUsage = function paymentLinksWithUsage(gatewayAccountId) {
    const queryParams = {
      params: {
        ...gatewayAccountId && { gatewayAccountId }
      }
    }
    return axiosInstance.get('/v1/api/stats/products', queryParams)
      .then(utilExtractData)
  }

  return {
    paymentLinksByGatewayAccount,
    paymentLinksWithUsage
  }
}

module.exports = productsMethods