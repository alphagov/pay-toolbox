const logger = require('./../../../lib/logger')
const { EntityNotFoundError } = require('./../../../lib/errors')

const detail = function detail(error, req, res, next) {
  if (error.name === 'RESTClientError' && error.data.response && error.data.response.status === 404) {
    throw new EntityNotFoundError('Service', req.params.id)
  }
  next(error)
}

const updateLinkAccounts = function updateLinkAccounts(error, req, res, next) {
  if (error.name === 'ValidationError') {
    // @FIXME(sfount) formalise recovery with recover utility (that timeout destroys objects)
    req.session.recovered = { id: req.body.account_id }
    logger.warn(`UpdateLinkAccounts ${error.message} (${req.body.account_id})`)
    req.flash('error', error.message)
    res.redirect(`/services/${req.params.id}/link_accounts`)
    return
  }

  if (error.name === 'RESTClientError' && error.data.response && error.data.response.status === 409) {
    const message = `Gateway account ${req.body.account_id} is already linked to a service`
    req.session.recovered = { id: req.body.account_id }
    logger.warn(message)
    req.flash('error', message)
    res.redirect(`/services/${req.params.id}/link_accounts`)
    return
  }
  next(error)
}

module.exports = { detail, updateLinkAccounts }
