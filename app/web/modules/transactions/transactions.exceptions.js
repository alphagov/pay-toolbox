const logger = require('./../../../lib/logger')

const searchTransaction = function searchTransaction (error, req, res, next) {
  if (error.name === 'ValidationError') {
    logger.warn(`TransactionSearch request ${error.message}`)
    req.flash('error', `TransactionSearch ${error.message}`)
    req.session.recovered = req.body
    res.redirect('/transactions/search')
    return
  }

  if (error.name === 'RESTClientError' && error.data.response && error.data.response.status === 404) {
    logger.warn(`Invalid Gateway Account for transaction search request ${error.message}`)
    req.flash('error', `Server returned 404 - No matching Charge ID found for Gateway Account ${req.body.account_id}.`)
    req.session.recovered = req.body
    res.redirect('/transactions/search')
    return
  }
  next(error)
}

module.exports = { searchTransaction }
