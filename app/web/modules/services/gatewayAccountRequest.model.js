const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')

const schema = {
  id: Joi.number().integer().required()
}

// simplified gateway account model for processing valid request
class GatewayAccountRequest {
  constructor (id) {
    const { error, value: model } = Joi.validate({ id }, schema)

    if (error) {
      throw new ValidationError(`GatewayAccountRequest ${error.details[0].message}`)
    }
    Object.assign(this, model)
  }
}

module.exports = GatewayAccountRequest
