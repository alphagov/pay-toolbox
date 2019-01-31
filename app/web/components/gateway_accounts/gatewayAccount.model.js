const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')

const providers = {
  card: [ 'card-sandbox', 'worldpay', 'smartpay', 'epdq' ],
  directDebit: [ 'direct-debit-sandbox', 'gocardless' ]
}

const systemAttributes = [ 'systemLinkedService' ]

const schema = {
  live: Joi.string().required().valid('live', 'not-live').required(),
  paymentMethod: Joi.string().valid('card', 'direct-debit').required(),
  description: Joi.string().required(),
  serviceName: Joi.string().required(),
  provider: Joi.string().required()
    .when('live', {
      is: 'live',
      then: Joi.string().invalid('card-sandbox', 'direct-debit-sandbox')
    })
    .when('paymentMethod', {
      is: 'card',
      then: Joi.string().valid(providers.card)
    })
    .when('paymentMethod', {
      is: 'direct-debit',
      then: Joi.string().valid(providers.directDebit)
    }),
  credentials: Joi.string()
}

class GatewayAccount {
  constructor (body) {
    const { error, value: model } = Joi.validate(body, schema)
    const parsed = this.defaults(model)

    // @TODO(sfount) remove system attributes
    if (error) {
      throw new ValidationError(`GatewayAccount ${error.details[0].message}`)
    }
    Object.assign(this, parsed)
  }

  defaults (model) {
    return model
  }

  // formats gateway account according to the Connector patch standard
  formatPayload () {
    const payload = {
      payment_provider: this.provider,
      description: this.generatedDescription || this.description,
      type: this.live === 'live' ? 'live' : 'test',
      service_name: this.name
    }

    if (this.provider === 'stripe' && this.credentials) {
      payload.credentials = this.credentials
    }
    if (this.generatedAnalyticsId) {
      payload.analytics_id = this.generatedAnalyticsId
    }
    return payload
  }
}

module.exports = GatewayAccount
