// @NOTE(sfount) - CSV doesn't seem to work on the current toolbox, it might work
// in production but I haven't seen this. Exporting entities as CSV/ JSON might
// be useful for people needing to share details on production accounts
// the route that would be for services CSV is services/csv
const logger = require('./../../../lib/logger')
const payapi = require('./../../../lib/pay-request')

// @FIXME(sfount) can anything that just passes errors onto next not explicitly create a try block?
const overview = async function overview (req, res, next) {
  try {
    const services = await payapi.service('ADMINUSERS', '/v1/api/services/list')
    console.log('got services', services)
    res.render('services/overview', { services })
  } catch (error) {
    next(error)
  }
}

const detail = async function detail (req, res, next) {
  const id = req.params.id

  try {
    const service = await payapi.service('ADMINUSERS', `/v1/api/services/${id}`)
    const users = await payapi.service('ADMINUSERS', `/v1/api/services/${id}/users`)
    res.render('services/detail', { service, users })
  } catch (error) {
    next(error)
  }
}

module.exports = { overview, detail }
