const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')

const schema = Joi.object({
  line1: Joi.string().required(),
  city: Joi.string().required(),
  postal_code: Joi.string().required()
})

class StripeAddress {
  constructor(body) {
    const params = { ...body }
    const { error, value: model } = schema.validate(
      params,
      { allowUnknown: true, stripUnknown: true }
    )

    Promise.resolve().then(this.basicObject())

    if (error) {
      throw new ValidationError(`Address ${error.details[0].message}`)
    }

    Object.assign(this, model)
  }

  basicObject() {
    return { ...this }
  }
}

module.exports = StripeAddress
