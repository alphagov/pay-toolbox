/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable no-new */
import GatewayAccount from './gatewayAccount.model'

import { ValidationError, IOValidationError } from '../../../lib/errors'
import validGatewayAccountRequestDetails from '../../../tests/fixtures/forms/GatewayAccountRequest'

describe('Gateway account creation request', () => {
  describe('Model', () => {
    test('Creates with valid details', () => {
      const account = new GatewayAccount(validGatewayAccountRequestDetails)
      expect(account).toBeInstanceOf(Object)
    })

    test('Rejects with empty live field', () => {
      const invalidDetails = { ...validGatewayAccountRequestDetails, live: '' }
      const create = () => { new GatewayAccount(invalidDetails) }
      expect(create).toThrow(IOValidationError)
    })

    test('Rejects when payment mehthod is empty', () => {
      const invalidDetails = { ...validGatewayAccountRequestDetails, paymentMethod: 'not-allowed' }
      const create = () => { new GatewayAccount(invalidDetails) }
      expect(create).toThrow(IOValidationError)
    })

    test('Rejects when description is empty', () => {
      const invalidDetails = { ...validGatewayAccountRequestDetails, description: '' }
      const create = () => { new GatewayAccount(invalidDetails) }
      expect(create).toThrow(IOValidationError)
    })

    test('Rejects when paymentMethod is card and non-card provider given', () => {
      const invalidDetails = { ...validGatewayAccountRequestDetails, paymentMethod: 'direct-debit', provider: 'stripe' }
      const create = () => { new GatewayAccount(invalidDetails) }
      expect(create).toThrow(ValidationError)
    })

    test('Rejects when account is live and provider is sandbox', () => {
      const invalidDetails = {
        ...validGatewayAccountRequestDetails,
        live: 'live',
        paymentMethod: 'direct-debit',
        provider: 'direct-debit-sandbox'
      }
      const create = () => { new GatewayAccount(invalidDetails) }
      expect(create).toThrow(ValidationError)
    })

    test('Rejects when provier is stripe and no credentials provided', () => {
      const invalidDetails = { ...validGatewayAccountRequestDetails, provider: 'stripe', credentials: '' }
      const create = () => { new GatewayAccount(invalidDetails) }
      expect(create).toThrow(ValidationError)
    })
  })
})
