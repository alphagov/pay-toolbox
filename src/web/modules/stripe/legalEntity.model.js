const Joi = require('joi')

const { ValidationError } = require('./../../../lib/errors')
const { addModelIfValid, stripEmpty } = require('./../../../lib/validation')
const Address = require('./address.model')
const Dob = require('./dob.model')

const schema = Joi.object({
  org_id: Joi.string(),
  org_name: Joi.string().required(),
  person_first_name: Joi.string(),
  person_last_name: Joi.string()
})

const addSubModels = function addSubModels(legalEntity, params) {
  let entityWithSubModels = { ...legalEntity }
  entityWithSubModels = addModelIfValid(legalEntity, {
    line1: params.person_address_line_1,
    city: params.person_address_city,
    postal_code: params.person_address_postcode
  }, Address, 'personal_address')
  entityWithSubModels = addModelIfValid(legalEntity, {
    line1: params.org_address_line_1,
    city: params.org_address_city,
    postal_code: params.org_address_postcode
  }, Address, 'address')
  entityWithSubModels = addModelIfValid(legalEntity, {
    day: params.person_dob_day,
    month: params.person_dob_month,
    year: params.person_dob_year
  }, Dob, 'dob')

  return entityWithSubModels
}

const build = function build(params) {
  const coreEntity = {
    type: 'government_agency',
    business_tax_id: params.org_id,
    business_name: params.org_name,
    first_name: params.person_first_name,
    last_name: params.person_last_name
  }

  // full legal entity including sub model attributes if they are validated
  const legalEntity = stripEmpty(addSubModels(coreEntity, params))

  // Stripe interprets an empty string to mean no other owners, which is what we want
  legalEntity.additional_owners = ''

  return legalEntity
}

class StripeLegalEntity {
  constructor(body) {
    const params = { ...body }
    const { error, value: model } = schema.validate(params, { allowUnknown: true })

    if (error) {
      throw new ValidationError(`StripeLegalEntity ${error.details[0].message}`)
    }

    Object.assign(this, build(model))
  }

  basicObject() {
    return { ...this }
  }
}

module.exports = StripeLegalEntity
