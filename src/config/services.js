// connected services environment requirements - any referenced services should
// be configured even if they are not used by all flows
const Joi = require('joi')

const expectedConnectedServicesEnvironmentValues = Joi.object({
  ADMINUSERS_URL: Joi.string().required(),
  CONNECTOR_URL: Joi.string().required(),
  DIRECT_DEBIT_CONNECTOR_URL: Joi.string().required(),
  PRODUCTS_URL: Joi.string().required(),
  PUBLIC_AUTH_URL: Joi.string().required(),
  LEDGER_URL: Joi.string().required(),
  SELFSERVICE_URL: Joi.string().required()
})

const { error, value: validatedConnectedServicesEnvironmentValues } = expectedConnectedServicesEnvironmentValues.validate(
  process.env,
  { allowUnknown: true, stripUnknown: true }
)

if (error) {
  throw new Error(`Invalid connected services environment variables set ${error.message}`)
}

module.exports = validatedConnectedServicesEnvironmentValues
