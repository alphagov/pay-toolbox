const { expect } = require('chai')
const _ = require('lodash')

const GatewayAccount = require('./gatewayAccount.model').default
const { ValidationError, IOValidationError } = require('./../../../lib/errors')

const validGatewayAccountDetails = {
  live: 'live',
  description: 'Valid gateway account details',
  serviceName: 'Valid gateway account service',
  provider: 'stripe',
  credentials: 'valid-credentials',
  sector: 'valid-sector',
  serviceId: 'service-id'
}

describe('Gateway Accounts', () => {
  describe('Modeling a Gateway Account', () => {
    it('successfully creates a model with valid details', () => {
      const account = new GatewayAccount(validGatewayAccountDetails)
      expect(account).to.be.an('object')
    })

    it('rejects when live field is empty', () => {
      expect(() => {
        const details = _.cloneDeep(validGatewayAccountDetails)
        details.live = ''

        // eslint-disable-next-line no-new
        new GatewayAccount(details)
      }).to.throw(IOValidationError)
    })

    it('rejects when live field is not allowed value', () => {
      expect(() => {
        const details = _.cloneDeep(validGatewayAccountDetails)
        details.live = 'not-valid'

        // eslint-disable-next-line no-new
        new GatewayAccount(details)
      }).to.throw(IOValidationError)
    })

    it('rejects when description is empty', () => {
      expect(() => {
        const details = _.cloneDeep(validGatewayAccountDetails)
        details.description = ''

        // eslint-disable-next-line no-new
        new GatewayAccount(details)
      }).to.throw(IOValidationError)
    })

    it('rejects when serviceName is empty', () => {
      expect(() => {
        const details = _.cloneDeep(validGatewayAccountDetails)
        details.serviceName = ''

        // eslint-disable-next-line no-new
        new GatewayAccount(details)
      }).to.throw(IOValidationError)
    })

    it('rejects when non-card provider given', () => {
      expect(() => {
        const details = _.cloneDeep(validGatewayAccountDetails)
        details.provider = 'gocardless'

        // eslint-disable-next-line no-new
        new GatewayAccount(details)
      }).to.throw(Error)
    })

    it('rejects when account is live and provider is card sandbox', () => {
      expect(() => {
        const details = _.cloneDeep(validGatewayAccountDetails)
        details.live = 'live'
        details.provider = 'sandbox'

        // eslint-disable-next-line no-new
        new GatewayAccount(details)
      }).to.throw(ValidationError)
    })

    it('successfully creates model when provider is not stripe and credentials is empty', () => {
      const details = _.cloneDeep(validGatewayAccountDetails)
      details.provider = 'worldpay'
      details.credentials = ''

      const account = new GatewayAccount(details)
      expect(account).to.be.an('object')
    })

    it('rejects when provider is stripe and no credentials provided', () => {
      expect(() => {
        const details = _.cloneDeep(validGatewayAccountDetails)
        details.provider = 'stripe'
        details.credentials = ''

        // eslint-disable-next-line no-new
        new GatewayAccount(details)
      }).to.throw(ValidationError)
    })

    it('successfully creates model when provider is worldpay and test account', function () {
      const details = _.cloneDeep(validGatewayAccountDetails)
      details.provider = 'worldpay'
      details.live = 'not-live'

      const account = new GatewayAccount(details)
      expect(account).to.be.an('object')
      account.serviceId = 'service-id'
      const payload = account.formatPayload()
      expect(payload.requires_3ds).to.eql(true)
    });
  })
})

