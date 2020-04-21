const Joi = require('joi')

const expectedAwsEnvironmentValues = {
  AWS_S3_UPDATE_TRANSACTIONS_BUCKET_NAME: Joi.string(),
  AWC_ECS_UPDATE_TRANSACTIONS_TASK_DEFINITION: Joi.string()
}

const { error, value: validatedAwsEnvironmentValues } = Joi.validate(
  process.env,
  expectedAwsEnvironmentValues,
  { allowUnknown: true, stripUnknown: true }
)

if (error) {
  throw new Error(`Invalid aws environment variables set ${error.message}`)
}

module.exports = validatedAwsEnvironmentValues
