const services = require('./services')

const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

const root = async function root(req, res) {
  const serviceStatuses = await services.healthCheck()
  res.render('landing/landing', { serviceStatuses })
}

const handlers = { root }
module.exports = wrapAsyncErrorHandlers(handlers)
