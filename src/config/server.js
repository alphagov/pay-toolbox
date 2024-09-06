const Joi = require('joi')

const expectedServerEnvironmentValues = Joi.object({
  BIND_HOST: Joi.string().ip().default("127.0.0.1"),
  PORT: Joi.number().integer().required(),
  COOKIE_SESSION_ENCRYPTION_SECRET: Joi.string().required(),
  HTTP_PROXY: Joi.string(),
  HTTPS_PROXY: Joi.string(),
  SESSION_COOKIE_DURATION_IN_MILLIS: Joi.number().integer()
})

const { error, value: validatedServerEnvironmentValues } = expectedServerEnvironmentValues.validate(
  process.env,
  { allowUnknown: true, stripUnknown: true }
)

if (error) {
  throw new Error(`Invalid server environment variables set ${error.message}`)
}

module.exports = validatedServerEnvironmentValues
