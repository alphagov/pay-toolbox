const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')

const schema = {
  date: Joi.date(),
  dateFrom: Joi.date(),
  dateTo: Joi.date()
}

class DateFilter {
  constructor (params) {
    const { error, value: model } = Joi.validate(params, schema)

    if (error) {
      throw new ValidationError(``)
    }
    Object.assing(this, model)
  }
}

module.exports = DateFilter
