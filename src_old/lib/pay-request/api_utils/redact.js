const redactProductTokens = function redactProductTokens(productResults) {
  return productResults.map((productResult) => {
    delete productResult.product.pay_api_token
    return productResult
  })
}

module.exports = { redactProductTokens }
