const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')
const { stripEmpty } = require('./../../../lib/validation')

const schema = {
  bank_account_sort_code: Joi.string().required(),
  bank_account_number: Joi.string().required()
}

const build = function build(params) {
  const core = {
    object: 'bank_account',
    country: 'GB',
    currency: 'GBP',
    account_holder_type: 'company',
    routing_number: params.bank_account_sort_code,
    account_number: params.bank_account_number
  }

  return stripEmpty(core)
}

class StripeBankAccount {
  constructor(body) {
    const params = { ...body }
    const { error, value: model } = Joi.validate(
      params,
      schema,
      { allowUnknown: true, stripUnknown: true }
    )

    if (error) {
      throw new ValidationError(`StripeBankAccount ${error.details[0].message}`)
    }

    Object.assign(this, build(model))
  }

  basicObject() {
    return { ...this }
  }
}

module.exports = StripeBankAccount
