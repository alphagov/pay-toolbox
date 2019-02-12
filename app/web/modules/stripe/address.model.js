const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')

const schema = {
  line1: Joi.string().required(),
  city: Joi.string().required(),
  postal_code: Joi.string().required()
}

class StripeAddress {
  constructor (body) {
    const params = Object.assign({}, body)
    const { error, value: model } = Joi.validate(params, schema, { allowUnknown: true, stripUnknown: true })

    if (error) {
      throw new ValidationError(`Address ${error.details[0].message}`)
    }

    Object.assign(this, model)
  }

  basicObject () {
    return Object.assign({}, this)
  }
}

module.exports = StripeAddress
