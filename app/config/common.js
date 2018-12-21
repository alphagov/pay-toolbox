/**
 * Common application wide configuration. Responsible for validating required
 * environment variables, eagerly shutting down process if not configured
 * correctly.
 *
 * - should alias config.common.production to allow furuther modules to write
 *   this more cleanly. (based on NODE_ENV)
 */
