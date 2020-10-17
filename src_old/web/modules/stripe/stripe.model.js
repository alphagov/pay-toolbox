const Joi = require('joi')
const { PhoneNumberFormat } = require('google-libphonenumber')
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance()

const { ValidationError } = require('./../../../lib/errors')
const { addModelIfValid, stripEmpty } = require('./../../../lib/validation')

const StripeBankAccount = require('./bankAccount.model')
const StripeLegalEntity = require('./legalEntity.model')

const schema = {
  org_id: Joi.string().required(),
  org_name: Joi.string().required(),
  org_ip_address: Joi.string().required(),
  org_statement_descriptor: Joi.string().required(),
  org_phone_number: Joi.string().required()
}

const toE164InternationalFormat = function toE164InternationalFormat(rawNumber) {
  if (rawNumber) {
    const phoneNumber = phoneUtil.parse(rawNumber, 'GB')
    return phoneUtil.format(phoneNumber, PhoneNumberFormat.E164)
  }

  return ''
}

const build = function build(params) {
  const core = {
    type: 'custom',
    country: 'GB',
    business_name: params.org_name,
    tos_acceptance: {
      ip: params.org_ip_address,
      date: Math.floor(Date.now() / 1000)
    },
    payout_statement_descriptor: params.org_statement_descriptor,
    statement_descriptor: params.org_statement_descriptor,
    support_phone: toE164InternationalFormat(params.org_phone_number)
  }

  let withSubModels = addModelIfValid(core, params, StripeLegalEntity, 'legal_entity')
  withSubModels = addModelIfValid(withSubModels, params, StripeBankAccount, 'external_account')

  return stripEmpty(withSubModels)
}

class StripeAccount {
  constructor(body) {
    const { error, value: model } = Joi.validate(body, schema, { allowUnknown: true })

    if (error) {
      throw new ValidationError(`StripeAccount ${error.details[0].message}`)
    }

    Object.assign(this, build(model))
  }

  basicObject() {
    return { ...this }
  }
}

module.exports = StripeAccount
