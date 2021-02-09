const Joi = require('joi')

const expectedAwsEnvironmentValues = Joi.object({
  AWS_S3_UPDATE_TRANSACTIONS_BUCKET_NAME: Joi.string(),
  AWC_ECS_UPDATE_TRANSACTIONS_TASK_DEFINITION: Joi.string()
})

const { error, value: validatedAwsEnvironmentValues } = expectedAwsEnvironmentValues.validate(
  process.env,
  { allowUnknown: true, stripUnknown: true }
)

if (error) {
  throw new Error(`Invalid aws environment variables set ${error.message}`)
}

module.exports = validatedAwsEnvironmentValues
