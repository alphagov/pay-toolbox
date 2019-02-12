const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')
const { addModelIfValid, stripEmpty } = require('./../../../lib/validation')
const Address = require('./address.model')
const Dob = require('./dob.model')

const schema = {
  org_id: Joi.string(),
  org_name: Joi.string().required(),
  person_first_name: Joi.string(),
  person_last_name: Joi.string()
}

const addSubModels = function addSubModels (legalEntity, params) {
  legalEntity = addModelIfValid(legalEntity, {
    line1: params.person_address_line_1,
    city: params.person_city,
    postcode: params.person_postcode
  }, Address, 'personal_address')
  legalEntity = addModelIfValid(legalEntity, {
    line1: params.org_address_line_1,
    city: params.org_city,
    postcode: params.org_postcode
  }, Address, 'address')
  legalEntity = addModelIfValid(legalEntity, params, Dob, 'external_account')

  return legalEntity
}

class StripeLegalEntity {
  constructor (body) {
    const params = Object.assign({}, body)
    const { error, value: model } = Joi.validate(params, schema, { allowUnknown: true, stripUnknown: true })

    if (error) {
      throw new ValidationError(`Dob ${error.details[0].message}`)
    }

    Object.assign(this, this.build(model))
  }

  basicObject () {
    return Object.assign({}, this)
  }

  build (params) {
    const core = {
      additional_owners: '', // Stripe interprets an empty string to mean no other owners, which is what we want
      type: 'government_agency',
      business_tax_id: params.org_id,
      business_name: params.org_name,
      first_name: params.person_first_name,
      last_name: params.person_last_name
    }
    const withSubModels = addSubModels(core, params)
    return stripEmpty(withSubModels)
  }
}

module.exports = StripeLegalEntity
