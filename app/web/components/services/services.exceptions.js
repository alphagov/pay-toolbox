const logger = require('./../../../lib/logger')
const { EntityNotFoundError } = require('./../../../lib/errors')

// experimental model for moving exception handling out of the direct controller
// the reason for moving this out is that it feels like a lot of boilerplate
// don't like the pattern though
//
// @FIXME(sfount) direct string comparisons should be changed to import error objects and compare
const detail = function details (error, req, res, next) {
  // @TODO(sfount) map these errors automatically, 404 could be mapped // @FIXME(sfount) horrible triple check
  if (error.name === 'RESTClientError' && error.data.response && error.data.response.status === 404) {
    throw new EntityNotFoundError('Service', req.params.id)
  }

  next(error)
}

const updateLinkAccounts = function updateLinkAccounts (error, req, res, next) {
  if (error.name === 'ValidationError') {
    // @FIXME(sfount) formalise recovery with recover utility (that timeout destroys objects)
    req.session.recovered = { id: req.body.account_id }
    req.flash('error', error.message)
    res.redirect(`/services/${req.params.id}/link_accounts`)
    return
  }

  if (error.name === 'RESTClientError' && error.data.response && error.data.response.status === 409) {
    const message = `Gateway account ${req.body.account_id} is already linked to service ${req.params.id}`
    req.session.recovered = { id: req.body.account_id }
    logger.warn(message)
    req.flash('error', message)
    res.redirect(`/services/${req.params.id}/link_accounts`)
    return
  }

  next(error)
}

module.exports = { detail, updateLinkAccounts }
