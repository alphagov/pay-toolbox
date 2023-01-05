const Joi = require('joi')

const expectedAuthEnvironmentValues = Joi.object({
  AUTH_GITHUB_ENABLED: Joi.boolean().required(),
  AUTH_GITHUB_CLIENT_ID: Joi.string(),
  AUTH_GITHUB_CLIENT_SECRET: Joi.string(),
  AUTH_GITHUB_RETURN_URL: Joi.string(),
  AUTH_GITHUB_VIEW_ONLY_TEAM_ID: Joi.number(),
  AUTH_GITHUB_USER_SUPPORT_TEAM_ID: Joi.number(),
  AUTH_GITHUB_ADMIN_TEAM_ID: Joi.number(),
  GITHUB_API_ENDPOINT: Joi.string(),
  GITHUB_ALPHAGOV_ORGANISATION_ID: Joi.string()
})

const { error, value: validatedAuthEnvironmentValues } = expectedAuthEnvironmentValues.validate(
  process.env,
  { allowUnknown: true, stripUnknown: true }
)

if (error) {
  throw new Error(`Invalid auth environment variables set ${error.message}`)
}

module.exports = validatedAuthEnvironmentValues
