/**
 * Primary landing (dashboard) page, builds responses to HTTP requests
 */
const logger = require('./../../../lib/logger')
const landing = require('./landing.controller.js')

/**
 * @METHOD GET
 * @PATH /
 */
// @TODO(sfount) `root` naming convention may well be more confusing than
// it's obvious
//
// @TODO(sfount) move check to async client side JS request - there's no point
// blocking the whole page for this. It is a quick request but should be
// extrapolated to a seperate process that could even be refreshed
const root = async function root (req, res, next) {
  // @TODO(sfount) write quick standard on how all modules must propegate errors
  // up to be handled at HTTP level - HTTP can choose to pass errors on to
  // middleware or handle them internally
  try {
    const serviceStatuses = await landing.serviceStatus()

    console.log('got service status', serviceStatuses)
    res.render('landing/landing', { serviceStatuses })
  } catch (error) {
    console.log('top level HTTP error handling caught error')
    logger.error(error)
    // this route isn't expecting any error behaviours - this is likely a 500
    // pass error on to be handled by final server error handler
    next(error)
  }
}

module.exports = { root }
