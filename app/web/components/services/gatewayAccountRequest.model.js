const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')

// @TODO(sfount) look at other repos model structure to improve how this works
// @TODO(sfount) use error name: field 'ValidationError', 'RESTClientError', etc.
const schema = {
  id: Joi.number().integer().required()
}

// trivial example of validation
// simplified gateway account model for processing valid request
class GatewayAccountRequest {
  constructor (id) {
    const { error, value: model } = Joi.validate({ id }, schema)

    if (error) {
      console.log(error)
      throw new ValidationError(`GatewayAccountRequest ${error.details[0].message}`)
    }
    Object.assign(this, model)
  }
}

module.exports = GatewayAccountRequest
