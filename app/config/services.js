// connected services environment requirements - if a service should be
// live it should be required in the environment
const Joi = require('joi')

const expectedConnectedServicesEnvironmentValues = {
  ADMINUSERS_URL: Joi.string().required(),
  CONNECTOR_URL: Joi.string().required(),
  DIRECT_DEBIT_CONNECTOR_URL: Joi.string().required(),
  PRODUCTS_URL: Joi.string().required(),
  PUBLIC_AUTH_URL: Joi.string().required()
}

// @TODO(sfount) write a wrapper library to do validation step - right now this
// is duplicated across all env config files
const { error, value: validatedConnectedServicesEnvironmentValues } =
  Joi.validate(process.env, expectedConnectedServicesEnvironmentValues, { allowUnknown: true, stripUnknown: true })

if (error) {
  throw new Error(`Invalid connected services environment variables set ${error.message}`)
}

module.exports = { services: validatedConnectedServicesEnvironmentValues }
