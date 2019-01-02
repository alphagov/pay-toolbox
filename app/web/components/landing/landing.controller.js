
// @TODO(sfount) note: for now all service checks will only happen when the
// dashboard is loaded + when individual controllers make requests for resources
// Scheduling a job to constantly be polling will come in the future

// 1. run health check across all REST clients
// 2. return results back up to be rendered by the template

// note: services helper library doing health checks may be a good abstraction
// here
const services = require('./../../../lib/services')

// fetches the results of all connected services health checks
// @TODO(sfount) small methods that coudl be inlined probably should be to reduce spider code
// - could be moved into HTTP handler with so little functionality
const serviceStatus = async function lannding () {
  return services.healthCheck()
}

module.exports = { serviceStatus }
