const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')

const schema = {
  account_id: Joi.string().required(),
  search_string: Joi.string().required(),
  search_by: Joi.string().valid('chargeId', 'reference').required()
}

class TransactionSearch {
  constructor(body) {
    const { error, value: model } = Joi.validate(
      body,
      schema,
      { allowUnknown: true, stripUnknown: true }
    )

    if (error) {
      throw new ValidationError(`TransactionSearch ${error.details[0].message}`)
    }
    Object.assign(this, model)
    this.byCharge = this.search_by === 'chargeId'
  }
}

module.exports = TransactionSearch
