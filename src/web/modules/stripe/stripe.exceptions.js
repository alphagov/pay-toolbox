const logger = require('./../../../lib/logger')

const createAccount = function createAccount(error, req, res, next) {
  if (error.name === 'ValidationError') {
    // @FIXME(sfount) recovery doesn't scale
    const { systemLinkService } = req.body
    const recoverSystemLink = systemLinkService ? `?service=${systemLinkService}` : ''
    req.session.recovered = req.body
    logger.warn(`CreateStripeAccount ${error.message}`)
    req.flash('error', error.message)
    res.redirect(`/stripe/create${recoverSystemLink}`)
    return
  }
  next(error)
}

module.exports = { createAccount }
