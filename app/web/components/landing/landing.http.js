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
    // @TODO(sfount) if REDIS is implemented (cross thread safe caching) store this
    // for minutes to not require blocking operation on multiple reloads
    const serviceStatuses = await landing.serviceStatus()
    res.render('landing/landing', { serviceStatuses })
  } catch (error) {
    // This will also be logged by the top level error handler
    // @FIXME(sfount) print full stack track not just message
    // @TODO(sfount) see https://github.com/winstonjs/winston/issues/1338 for printing full stack trace
    logger.error(error.message)
    // this route isn't expecting any error behaviours - this is likely a 500
    // pass error on to be handled by final server error handler
    next(error)
  }
}

module.exports = { root }
