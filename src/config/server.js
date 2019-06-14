const Joi = require('joi')

const expectedServerEnvironmentValues = {
  PORT: Joi.number().integer().required(),
  COOKIE_SESSION_ENCRYPTION_SECRET: Joi.string().required()
}

const { error, value: validatedServerEnvironmentValues } = Joi.validate(
  process.env,
  expectedServerEnvironmentValues,
  { allowUnknown: true, stripUnknown: true }
)

if (error) {
  throw new Error(`Invalid server environment variables set ${error.message}`)
}

module.exports = { server: validatedServerEnvironmentValues }
