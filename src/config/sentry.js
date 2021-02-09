const Joi = require('joi')

const expectedSentryEnvironmentValues = Joi.object({
  SENTRY_DSN: Joi.string()
})

const { error, value: validatedSentryEnvironmentValues } = expectedSentryEnvironmentValues.validate(
  process.env,
  { allowUnknown: true, stripUnknown: true }
)

if (error) {
  throw new Error(`Invalid sentry environment variables set ${error.message}`)
}

module.exports = validatedSentryEnvironmentValues
