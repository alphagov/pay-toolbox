const Joi = require('joi')

const expectedAwsEnvironmentValues = Joi.object({
  AWS_S3_UPDATE_TRANSACTIONS_FARGATE_BUCKET_NAME: Joi.string(),
  AWS_ECS_UPDATE_TRANSACTIONS_FARGATE_TASK_DEFINITION: Joi.string(),
  AWS_VPC_UPDATE_TRANSACTIONS_FARGATE_SECURITY_GROUP_IDS: Joi.string(),
  AWS_VPC_UPDATE_TRANSACTIONS_FARGATE_SUBNET_IDS: Joi.string()
})

const { error, value: validatedAwsEnvironmentValues } = expectedAwsEnvironmentValues.validate(
  process.env,
  { allowUnknown: true, stripUnknown: true }
)

if (error) {
  throw new Error(`Invalid aws environment variables set ${error.message}`)
}

module.exports = validatedAwsEnvironmentValues
