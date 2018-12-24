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
const config = {
  common: {
    production: process.env.NODE_ENV === 'production'
  }
}
// module.exports = Object.assign({}, common)
module.exports = config
