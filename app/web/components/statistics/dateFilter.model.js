const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')

const schema = {
  date: Joi.date(),
  compareDate: Joi.date()
}

class DateFilter {
  constructor (body) {
    const { error, value: model } = Joi.validate(this.parseFromBody(body), schema)

    if (error) {
      throw new ValidationError(`StatisticsDateFilter ${error.details[0].message}`)
    }

    // @TODO(sfount) delegate this to a method
    model.date = model.date && model.date.toISOString()
    model.compareDate = model.compareDate && model.compareDate.toISOString()
    Object.assign(this, model)
  }

  parseFromBody (body) {
    const params = {}

    params.date = new Date(body['filter-year'], body['filter-month'] - 1, body['filter-day'])

    // @FIXME(sfount) hack TM
    if (Object.keys(body).includes('filter-compare-year')) {
      params.compareDate = new Date(body['filter-compare-year'], body['filter-compare-month'] - 1, body['filter-compare-day'])
    }
    return params
  }
}

module.exports = DateFilter
