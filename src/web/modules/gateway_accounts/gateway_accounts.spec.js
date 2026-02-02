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

        new GatewayAccount(details)
      }).to.throw(IOValidationError)
    })

    it('rejects when live field is not allowed value', () => {
      expect(() => {
        const details = _.cloneDeep(validGatewayAccountDetails)
        details.live = 'not-valid'

        new GatewayAccount(details)
      }).to.throw(IOValidationError)
    })

    it('rejects when description is empty', () => {
      expect(() => {
        const details = _.cloneDeep(validGatewayAccountDetails)
        details.description = ''

        new GatewayAccount(details)
      }).to.throw(IOValidationError)
    })

    it('rejects when serviceName is empty', () => {
      expect(() => {
        const details = _.cloneDeep(validGatewayAccountDetails)
        details.serviceName = ''

        new GatewayAccount(details)
      }).to.throw(IOValidationError)
    })

    it('rejects when non-card provider given', () => {
      expect(() => {
        const details = _.cloneDeep(validGatewayAccountDetails)
        details.provider = 'gocardless'

        new GatewayAccount(details)
      }).to.throw(Error)
    })

    it('rejects when account is live and provider is card sandbox', () => {
      expect(() => {
        const details = _.cloneDeep(validGatewayAccountDetails)
        details.live = 'live'
        details.provider = 'sandbox'

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
      expect(payload.allow_apple_pay).to.eql(true)
      /* eslint-disable @typescript-eslint/no-unused-expressions */
      expect(payload.allow_google_pay).to.not.exist
    });

    it('successfully creates model when provider is stripe and test account', function () {
      const details = _.cloneDeep(validGatewayAccountDetails)
      details.live = 'not-live'

      const account = new GatewayAccount(details)
      expect(account).to.be.an('object')
      account.serviceId = 'service-id'
      const payload = account.formatPayload()
      expect(payload.requires_3ds).to.eql(true)
      expect(payload.allow_apple_pay).to.eql(true)
      expect(payload.allow_google_pay).to.eql(true)
    });

    it('successfully creates model with send_payer_email_to_gateway and send_payer_ip_address_to_gateway set to true', function () {
      const details = _.cloneDeep(validGatewayAccountDetails)
      details.live = 'not-live'

      const account = new GatewayAccount(details)
      expect(account).to.be.an('object')
      account.serviceId = 'service-id'
      const payload = account.formatPayload()
      expect(payload.send_payer_email_to_gateway).to.eql(true)
      expect(payload.send_payer_ip_address_to_gateway).to.eql(true)
    });
  })
})

