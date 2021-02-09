const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')

const schema = Joi.object({
  day: Joi.number().required(),
  month: Joi.number().required(),
  year: Joi.number().required()
})

class Dob {
  constructor(body) {
    const params = { ...body }
    const { error, value: model } = schema.validate(
      params,
      { allowUnknown: true, stripUnknown: true }
    )

    if (error) {
      throw new ValidationError(`Dob ${error.details[0].message}`)
    }

    Object.assign(this, model)
  }

  basicObject() {
    return { ...this }
  }
}

module.exports = Dob
