const services = require('./../../../lib/services')

const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

const root = async function root (req, res, next) {
  const serviceStatuses = await services.healthCheck()
  res.render('landing/landing', { serviceStatuses })
}

const handlers = { root }
module.exports = wrapAsyncErrorHandlers(handlers)
