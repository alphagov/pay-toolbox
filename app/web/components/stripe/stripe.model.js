const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')

const schema = {
  bank_account_sort_code: Joi.string().required(),
  bank_account_number: Joi.string().required(),
  org_address_line_1: Joi.string().required(),
  org_address_city: Joi.string().required(),
  org_address_postcode: Joi.string().required(),
  person_dob_day: Joi.number().required(),
  person_dob_month: Joi.number().required(),
  person_dob_year: Joi.number().required(),
  org_id: Joi.string().required(),
  org_name: Joi.string().required(),
  person_address_line_1: Joi.string().required(),
  person_address_city: Joi.string().required(),
  person_address_postcode: Joi.string().required(),
  person_first_name: Joi.string().required(),
  person_last_name: Joi.string().required(),
  org_ip_address: Joi.string().required(),
  org_statement_descriptor: Joi.string().required(),
  org_phone_number: Joi.string().required()
}

class StripeAccount {
  constructor (body) {
    const { error, value: model } = Joi.validate(body, schema, { allowUnknown: true, stripUnknown: true })

    if (error) {
      throw new ValidationError(`StripeAccount ${error.details[0].message}`)
    }

    Object.assign(this, this.applyDefaults(model))
  }

  basicObject () {
    return Object.assign({}, this)
  }

  applyDefaults (params) {
    const defaults = {
      type: 'custom',
      country: 'GB',
      business_name: params.org_name,
      external_account: {
        object: 'bank_account',
        country: 'GB',
        currency: 'GBP',
        account_holder_type: 'company',
        routing_number: params.bank_account_sort_code,
        account_number: params.bank_account_number
      },
      legal_entity: {
        address: {
          line1: params.org_address_line_1,
          city: params.org_address_city,
          postal_code: params.org_address_postcode
        },
        additional_owners: '',
        dob: {
          day: Number(params.person_dob_day),
          month: Number(params.person_dob_month),
          year: Number(params.person_dob_year)
        },
        business_tax_id: params.org_id,
        business_name: params.org_name,
        personal_address: {
          line1: params.person_address_line_1,
          city: params.person_address_city,
          postal_code: params.person_address_postcode
        },
        first_name: params.person_first_name,
        last_name: params.person_last_name,
        type: 'government_agency'
      },
      tos_acceptance: {
        ip: params.org_ip_address,
        date: Math.floor(Date.now() / 1000)
      },
      payout_statement_descriptor: params.org_statement_descriptor,
      support_phone: params.org_phone_number
    }

    return defaults
  }
}

module.exports = StripeAccount
