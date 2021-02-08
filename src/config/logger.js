const Joi = require('joi')

const expectedLoggingEnvironmentValues = Joi.object({
  DISABLE_REQUEST_LOGGING: Joi.boolean().default(false)
})

const { error, value: validatedLoggingEnvironmentValues } = expectedLoggingEnvironmentValues.validate(
  process.env,
  { allowUnknown: true, stripUnknown: true }
)

if (error) {
  throw new Error(`Invalid logging environment variables set ${error.message}`)
}

module.exports = validatedLoggingEnvironmentValues
