const Joi = require('joi')

const expectedAuthEnvironmentValues = {
  AUTH_GITHUB_ENABLED: Joi.boolean().required(),
  AUTH_GITHUB_CLIENT_ID: Joi.string(),
  AUTH_GITHUB_CLIENT_SECRET: Joi.string(),
  AUTH_GITHUB_RETURN_URL: Joi.string(),
  AUTH_GITHUB_TEAM_ID: Joi.number(),
  AUTH_GITHUB_ADMIN_TEAM_ID: Joi.number().allow('')
}

const { error, value: validatedAuthEnvironmentValues } = Joi.validate(
  process.env,
  expectedAuthEnvironmentValues,
  { allowUnknown: true, stripUnknown: true }
)

if (error) {
  throw new Error(`Invalid auth environment variables set ${error.message}`)
}

module.exports = validatedAuthEnvironmentValues
