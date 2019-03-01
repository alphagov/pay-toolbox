const GatewayAccount = require('./gatewayAccount.model.js')

const { expect } = require('chai')

const validGatewayAccountDetails = {
  live: 'live',
  paymentMethod: 'card',
  description: 'Valid gateway account details',
  serviceName: 'Valid gateway account service',
  provider: 'stripe',
  analyticsId: 'fs-valid-id',
  credentials: 'valid-credentials'
}

const invalidLiveSandboxAccountDetails = Object.assign({}, validGatewayAccountDetails, {
  provider: 'card-sandbox'
})

describe('Gateway Accounts', () => {
  describe('Modeling a Gateway Account', () => {
    it('successfully creates a model with valid details', () => {
      const account = new GatewayAccount(validGatewayAccountDetails)
      expect(account).to.be.an('object')
    })

    it('rejects a model with invalid details', () => {
      expect(() => {
        const account = new GatewayAccount(invalidLiveSandboxAccountDetails)
        expect(account).to.be.an('object')
      }).to.throw('live accounts cannot use Sandbox providers')
    })
  })
})
