const payapi = require('./../../../lib/pay-request')

// @FIXME(sfount)
// @TODO(sfount) transaction search doesn't seem to have been fully through
// reconsider client side UX and backend functionality once the context for
// finding transactions is made clear

const search = async function search (req, res, next) {
  // in case an error with previous search was thrown
  // @FIXME(sfount) unfiorm utility for ensuring the req cookie is never blown up or not cleard
  const recovered = Object.assign({}, req.session.recovered)
  delete req.recovered
  res.render('transactions/search', { messages: req.flash('error'), recovered })
}

const searchByChargeId = async function searchByChargeId (accountId, chargeId) {
  return payapi.service('CONNECTOR', `/v1/api/accounts/${accountId}/charges/${chargeId}/events`)
}

const searchByReference = async function searchByReference (accountId, reference) {
  return payapi.service('CONNECTOR', `/v2/api/accounts/${accountId}/charges?reference=${reference}`)
}

const searchTransaction = async function searchTransaction (req, res, next) {
  const accountId = req.body.account_id
  try {
    const searchByCharge = req.body.search_by === 'chargeId'
    const searchString = req.body.search_string

    // @FIXME(sfount) throw this error and then handle it - don't set a precedent of doing whatever with res whenever the programmer wants
    if (!accountId || !searchString || !req.body.search_by) {
      // throw new Error('Invalid search params, account ID, search string and search by required')

      req.flash('error', 'Invalid search params, account ID, search string and search by required')
      req.session.recovered = req.body
      res.redirect('/transactions/search')
      return
    }

    const searchMethod = searchByCharge ? searchByChargeId : searchByReference
    const events = await searchMethod(accountId, searchString)
    res.render('transactions/search_results', { events: events.results })
  } catch (error) {
    if (error.response && error.response.status === 404) {
      req.flash('error', `Connector returned 404. This is likely because ${accountId} is not a valid Gateway Account ID`)
      req.session.recovered = req.body
      res.redirect('/transactions/search')
    }
    next(error)
  }
}

module.exports = { search, searchTransaction }
