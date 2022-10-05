const Joi = require('joi')
const moment = require('moment')

const { ValidationError } = require('./../../../lib/errors')

const schema = Joi.object({
  fromDate: Joi.date(),
  toDate: Joi.date()
})

const convertToISODates = function convertToISODates(model) {
  const converted = { ...model }
  converted.fromDate = model.fromDate && model.fromDate.toISOString()
  converted.toDate = model.toDate && model.toDate.toISOString()
  return converted
}

const parseFromBody = function parseFromBody(body) {
  const params = {}

  params.fromDate = new Date(body['from-date-year'], body['from-date-month'] - 1)
  params.toDate = new Date(body['to-date-year'], body['to-date-month'] - 1)

  params.fromDate.setDate(moment(params.fromDate).startOf('month').date())
  params.toDate.setDate(moment(params.toDate).endOf('month').date())
  return params
}

class BetweenDatesFilter {
  constructor(body) {
    const { error, value: model } = schema.validate(parseFromBody(body))

    if (error) {
      throw new ValidationError(`StatisticsDateFilter ${error.details[0].message}`)
    }
    Object.assign(this, convertToISODates(model))
  }
}

module.exports = BetweenDatesFilter
