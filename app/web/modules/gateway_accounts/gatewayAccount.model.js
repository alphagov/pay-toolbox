const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')

const sandbox = {
  card: 'card-sandbox',
  directDebit: 'direct-debit-sandbox'
}
const providers = {
  card: [sandbox.card, 'worldpay', 'smartpay', 'epdq', 'stripe'],
  directDebit: [sandbox.directDebit, 'gocardless']
}
const paymentMethod = {
  card: 'card',
  directDebit: 'direct-debit'
}

const schema = {
  live: Joi.string().required().valid('live', 'not-live').required(),
  paymentMethod: Joi.string().valid(paymentMethod.card, paymentMethod.directDebit).required(),
  description: Joi.string().required(),
  serviceName: Joi.string().required(),
  provider: Joi
    .when('paymentMethod', {
      is: paymentMethod.card,
      then: Joi.string().required().valid(providers.card)
    })
    .when('paymentMethod', {
      is: paymentMethod.directDebit,
      then: Joi.string().required().valid(providers.directDebit)
    })
    .when('live', {
      is: 'live',
      then: Joi.string().required().invalid(sandbox.card, sandbox.directDebit)
    }),
  analyticsId: Joi.string().required(),
  credentials: Joi.string().allow('')
    .when('provider', {
      is: 'stripe',
      then: Joi.string().required()
    })
}

class GatewayAccount {
  constructor (body) {
    const { error, value: model } = Joi.validate(body, schema, { allowUnknown: true, stripUnknown: true })
    const parsed = this.defaults(model)

    if (error) {
      throw new ValidationError(`GatewayAccount ${error.details[0].message}`)
    }

    // throw custom error if live account is attempting to use sandbox
    if (parsed.live === 'live' && [sandbox.card, sandbox.directDebit].includes(parsed.provider)) {
      throw new ValidationError('GatewayAccount live accounts cannot use Sandbox providers.')
    }

    parsed.isDirectDebit = parsed.paymentMethod === paymentMethod.directDebit

    Object.assign(this, parsed)
  }

  defaults (model) {
    return model
  }

  // formats gateway account according to the Connector patch standard
  formatPayload () {
    const payload = {
      payment_provider: this.provider,
      description: this.description,
      type: this.live === 'live' ? 'live' : 'test',
      service_name: this.serviceName,
      analytics_id: this.analyticsId,
      requires_3ds: this.provider === 'stripe' ? 'true' : 'false'
    }

    if (this.provider === 'stripe' && this.credentials) {
      payload.credentials = {
        stripe_account_id: this.credentials
      }
    }
    return payload
  }
}

module.exports = GatewayAccount
