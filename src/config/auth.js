const Joi = require('joi')

const expectedAuthEnvironmentValues = {
  AUTH_GITHUB_CLIENT_ID: Joi.string().required(),
  AUTH_GITHUB_CLIENT_SECRET: Joi.string().required(),
  AUTH_GITHUB_RETURN_URL: Joi.string().required(),
  AUTH_GITHUB_TEAM_ID: Joi.number().required(),
  AUTH_GITHUB_ADMIN_TEAM_ID: Joi.number()
}

const { error, value: validatedAuthEnvironmentValues } = Joi.validate(
  process.env,
  expectedAuthEnvironmentValues,
  { allowUnknown: true, stripUnknown: true }
)

if (error) {
  throw new Error(`Invalid auth environment variables set ${error.message}`)
}

module.exports = { auth: validatedAuthEnvironmentValues }
