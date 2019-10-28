const Joi = require('joi')

const expectedSentryEnvironmentValues = {
  SENTRY_DSN: Joi.string(),
  ENVIRONMENT: Joi.string()
}

const { error, value: validatedSentryEnvironmentValues } = Joi.validate(
  process.env,
  expectedSentryEnvironmentValues,
  { allowUnknown: true, stripUnknown: true }
)

if (error) {
  throw new Error(`Invalid sentry environment variables set ${error.message}`)
}

module.exports = validatedSentryEnvironmentValues
