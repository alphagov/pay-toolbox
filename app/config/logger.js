const Joi = require('joi')

const expectedLoggingEnvironmentValues = {
  DISABLE_REQUEST_LOGGING: Joi.boolean().default(false)
}

const { error, value: validatedLoggingEnvironmentValues } =
  Joi.validate(process.env, expectedLoggingEnvironmentValues, { allowUnknown: true, stripUnknown: true })

if (error) {
  throw new Error(`Invalid logging environment variables set ${error.message}`)
}

module.exports = { logger: validatedLoggingEnvironmentValues }
