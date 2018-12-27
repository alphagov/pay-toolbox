/**
 * Common application wide configuration. Responsible for validating required
 * environment variables, eagerly shutting down process if not configured
 * correctly.
 *
 * - should alias config.common.production to allow furuther modules to write
 *   this more cleanly. (based on NODE_ENV)
 */

// @TODO(sfount) use library like `joi` to validate config vars eagerly on
// startup

// temporarily transform NODE_ENV env variable into a boolean flag
const Joi = require('joi')

const expectedCommonEnvironmentValues = {
  TOOLBOX_FILE_ROOT: Joi.string().required(),
  NODE_ENV: Joi.string().valid(['development', 'production', 'test']).required()
}

const { error, value: validatedCommonEnvironmentValues } =
  Joi.validate(process.env, expectedCommonEnvironmentValues, { allowUnknown: true, stripUnknown: true })

if (error) {
  throw new Error(`Invalid common environment variables set ${error.message}`)
}

// custom mapping for commonly referenced NODE_ENV production check
validatedCommonEnvironmentValues.production = process.env.NODE_ENV === 'production'

module.exports = { common: validatedCommonEnvironmentValues }
