const logger = require('./../../../lib/logger')

const createAccount = function createAccount (error, req, res, next) {
  if (error.name === 'ValidationError') {
    req.session.recovered = req.body
    logger.warn(`CreateStripeAccount ${error.message}`)
    req.flash('error', error.message)
    res.redirect('/stripe/create')
    return
  }
  next(error)
}

module.exports = { createAccount }
