const chai = require('chai')
const { expect } = chai

const { redactProductTokens } = require('./redact')
const { paymentLinksListResponse } = require('./../../../tests/fixtures/paymentLink')

describe('redaction utility for internal apis that cant be changed immediately', () => {
  describe('product api', () => {
    it('pay_api_token property is removed from all returned products', () => {
      const redactedResultStream = redactProductTokens(paymentLinksListResponse)
      expect(redactedResultStream[0].product.pay_api_token).to.equal(undefined)
      expect(redactedResultStream[1].product.pay_api_token).to.equal(undefined)
      expect(redactedResultStream[2].product.pay_api_token).to.equal(undefined)
    })

    it('returns the same empty list if nothing is returned from the server', () => {
      const redactedResultStream = redactProductTokens([])
      expect(redactedResultStream).to.deep.equal([])
    })
  })
})
