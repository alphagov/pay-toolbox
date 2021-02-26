const redactProductTokensFromPaymentLinksWithUsage = function redactProductTokens(productResults) {
  return productResults.map((productResult) => {
    delete productResult.product.pay_api_token
    return productResult
  })
}

const redactProductTokensFromProducts = function redactProductTokens(products) {
  return products.map((product) => {
    delete product.pay_api_token
    return product
  })
}

module.exports = { redactProductTokensFromPaymentLinksWithUsage, redactProductTokensFromProducts }
