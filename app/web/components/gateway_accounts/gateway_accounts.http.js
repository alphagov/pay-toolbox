const payapi = require('./../../../lib/pay-request')

// @FIXME(sfount) - WHAT IF:
// - API rejects request
const overview = async function overview (req, res, next) {
  try {
    const response = await payapi.service('CONNECTOR', '/v1/api/accounts')
    res.render('gateway_accounts/overview', { accounts: response.accounts })
  } catch (error) {
    next(error)
  }
}

const create = async function create (req, res, next) {
  // @FIXME(sfount) without careful tests this could end up exploding the cookie sent to the client
  const context = { messages: req.flash('error') }

  if (req.session.recovered) {
    context.recovered = Object.assign({}, req.session.recovered)
    delete req.session.recovered
  }
  res.render('gateway_accounts/create', context)
}

// @TODO(sfount) this should be moved to gateway account specific model
const addDefaults = function addDefaults (details) {
  if (details.live === 'live') {
    details.description = `${details.department} ${details.serviceReference} ${details.provider && details.provider.toUpperCase()}`
    details.analytics_id = `${details.department}-${details.serviceReference}`
  }
  return Object.assign({}, details)
}

const confirm = async function confirm (req, res, next) {
  const proposedAccountDetails = addDefaults(req.body)
  try {
    // top level requirements - these should be enforced from client side and are just sanity checks
    if (!proposedAccountDetails.live || !proposedAccountDetails.paymentMethod || !proposedAccountDetails.provider) {
      throw new Error('Missing basic details (live status, payment method or payment provider)')
    }
    // ensure certain fields are provided if the user has requested a live account
    // @TODO(sfount) should the "service" be the service ID? the service name?
    // @TODO(sfount) looks like the it's the service name according to other source
    // @TODO(sfount) small utility method to require properties on object to exist
    // @TODO(sfount) small utility method to require properties to be certain values
    // @TODO(sfount) how can we list services to be selected when they're required etc. (UX)
    if (proposedAccountDetails.live === 'live') {
      // @FIXME(sfount) @TODO(sfount) move these validations into a `model` file for GatewayAccounts - this will be responsible for
      // throwing these errors
      // @TODO(sfount) model class could convert 'live' 'not-live' text to Boolean

      if (proposedAccountDetails.paymentMethod === 'sandbox' || proposedAccountDetails.paymentMethod === 'direct-debit-sandbox') {
        throw new Error('Payment method cannot be Sanbox for live accounts')
      }

      if (proposedAccountDetails.paymentMethod === 'card') {
        const validCardTypes = ['card-sandbox', 'worldpay', 'smartpay', 'epdq', 'stripe']

        if (!validCardTypes.includes(proposedAccountDetails.provider)) {
          throw new Error(`Invalid Card method payment provider ${proposedAccountDetails.provider}`)
        }
      } else if (proposedAccountDetails.paymentMethod === 'direct-debit') {
        const validDirectDebitTypes = ['direct-debit-sandbox', 'gocardless']

        if (!validDirectDebitTypes.includes(proposedAccountDetails.provider)) {
          throw new Error(`Invalid Direct Debit method payment provider ${proposedAccountDetails.provider}`)
        }
      }
    }

    if (!proposedAccountDetails.description || !proposedAccountDetails.name) {
      throw new Error('Description and service name are required for all accounts')
    }


    throw new Error('Route isn\'t configured yet.')
  } catch (error) {
    // @FIXME(sfount) without careful tests this could end up exploding the cookie sent to the client
    req.session.recovered = proposedAccountDetails
    req.flash('error', error.message)
    res.redirect('/gateway_accounts/create')
    // res.status(500).send(error.message)
  }
}


const writeAccount = function writeAccount (req, res, next) {

}

module.exports = { overview, create, confirm, writeAccount }
