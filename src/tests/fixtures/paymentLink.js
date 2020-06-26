const paymentLinksListResponse = [{
  payment_count: 100,
  last_payment_date: 'some-payment-date',
  product: {
    external_id: 'some-product-external-id',
    pay_api_token: 'some-api-token'
  }
}, {
  payment_count: 200,
  last_payment_date: 'some-payment_date',
  product: {
    external_id: 'some-second-product-external-id',
    pay_api_token: 'some-api-token'
  }
}, {
  payment_count: 200,
  last_payment_date: 'some-payment-date',
  product: {
    pay_api_token: 'some-api-token'
  }
}]

module.exports = { paymentLinksListResponse }
