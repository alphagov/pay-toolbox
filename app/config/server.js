const Joi = require('joi')

const expectedServerEnvironmentValues = {
  PORT: Joi.number().integer().required()
}

const { error, value: validatedServerEnvironmentValues } =
  Joi.validate(process.env, expectedServerEnvironmentValues, { allowUnknown: true, stripUnknown: true })

if (error) {
  throw new Error(`Invalid server environment variables set ${error.message}`)
}

module.exports = { server: validatedServerEnvironmentValues }
