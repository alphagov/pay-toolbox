function redactProductTokensFromPaymentLinksWithUsage(productResults) {
  return productResults.map((productResult) => {
    delete productResult.product.pay_api_token
    return productResult
  })
}

function redactProductTokensFromProducts(products) {
  return products.map((product) => {
    return redactProductTokenFromProduct(product)
  })
}

function redactProductTokenFromProduct(product) {
  delete product.pay_api_token
  return product
}

module.exports = {
  redactProductTokensFromPaymentLinksWithUsage,
  redactProductTokensFromProducts,
  redactProductTokenFromProduct
}
