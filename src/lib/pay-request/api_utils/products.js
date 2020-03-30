import { EntityNotFoundError } from '../../errors'

const productsMethods = function productsMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = (response) => response.data

  const paymentLinksByGatewayAccount = function paymentLinksByGatewayAccount(id) {
    return axiosInstance.get(`/v1/api/gateway-account/${id}/products`)
      .then(utilExtractData)
  }

  return {
    paymentLinksByGatewayAccount
  }
}

module.exports = productsMethods