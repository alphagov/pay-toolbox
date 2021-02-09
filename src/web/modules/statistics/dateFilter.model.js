const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')

const schema = Joi.object({
  date: Joi.date(),
  compareDate: Joi.date()
})

const convertToISODates = function convertToISODates(model) {
  const converted = { ...model }
  converted.date = model.date && model.date.toISOString()
  converted.compareDate = model.compareDate && model.compareDate.toISOString()
  return converted
}

const parseFromBody = function parseFromBody(body) {
  const params = {}

  params.date = new Date(body['filter-year'], body['filter-month'] - 1, body['filter-day'])

  // @FIXME(sfount) hack TM
  if (Object.keys(body).includes('filter-compare-year')) {
    params.compareDate = new Date(body['filter-compare-year'], body['filter-compare-month'] - 1, body['filter-compare-day'])
  }
  return params
}

class DateFilter {
  constructor(body) {
    const { error, value: model } = schema.validate(parseFromBody(body))

    if (error) {
      throw new ValidationError(`StatisticsDateFilter ${error.details[0].message}`)
    }
    Object.assign(this, convertToISODates(model))
  }
}

module.exports = DateFilter
