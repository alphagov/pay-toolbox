const payapi = require('./../../../lib/pay-request')

// @TODO(sfount) lots of tests ensuring the behaviour of creating account client + server validation

// @FIXME(sfount) - WHAT IF:
// - API rejects request
const overview = async function overview (req, res, next) {
  try {
    const response = await payapi.service('CONNECTOR', '/v1/api/accounts')
    res.render('gateway_accounts/overview', { accounts: response.accounts, messages: req.flash('info') })
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
    details.generatedDescription = `${details.department} ${details.serviceReference} ${details.provider && details.provider.toUpperCase()}`
    details.generatedAnalyticsId = `${details.department}-${details.serviceReference}`
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
    // @TODO(sfount) look at using Joi library to do this
    // @TODO(sfount) should the "service" be the service ID? the service name?
    // @TODO(sfount) looks like the it's the service name according to other source
    // @TODO(sfount) small utility method to require properties on object to exist
    // @TODO(sfount) small utility method to require properties to be certain values
    // @TODO(sfount) how can we list services to be selected when they're required etc. (UX)
    if (proposedAccountDetails.live === 'live') {
      // @FIXME(sfount) @TODO(sfount) move these validations into a `model` file for GatewayAccounts - this will be responsible for
      // throwing these errors
      // @TODO(sfount) model class could convert 'live' 'not-live' text to Boolean

      if (proposedAccountDetails.provider === 'card-sandbox' || proposedAccountDetails.provider === 'direct-debit-sandbox') {
        throw new Error('Payment method cannot be Sandbox for live accounts')
      }

      // @TODO(sfount) this validation should be done whether it is live or not
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

      if (!proposedAccountDetails.department || !proposedAccountDetails.serviceReference) {
        throw new Error('Department and department service must be set for live accounts')
      }
    }

    if (!proposedAccountDetails.description || !proposedAccountDetails.name) {
      throw new Error('Description and service name are required for all accounts')
    }

    res.render('gateway_accounts/confirm', { proposedAccountDetails })
  } catch (error) {
    // @FIXME(sfount) without careful tests this could end up exploding the cookie sent to the client
    req.session.recovered = proposedAccountDetails
    req.flash('error', error.message)
    res.redirect('/gateway_accounts/create')
    // res.status(500).send(error.message)
  }
}

const writeAccount = async function writeAccount (req, res, next) {
  const account = req.body
  try {
    // @FIXME(sfount) re-validate and model account details

    // curate payload
    // @TODO(sfount) this should be done in the model code
    const payload = {
      payment_provider: account.provider,
      description: account.generatedDescription || account.description,
      type: account.live === 'live' ? 'live' : 'test',
      service_name: account.name
    }

    // @FIXME(sfount) all of this needs to be carefully tested
    if (account.provider === 'stripe' && account.credentials) {
      payload.credentials = account.credentials
    }

    if (account.generatedAnalyticsId) {
      payload.analytics_id = account.generatedAnalyticsId
    }

    // @FIXME(sfount) very temporary usage of this - payapi should ideally return the REST client itself so that payapi.connector.get('relative/api/piece')
    const response = await payapi.servicePost('CONNECTOR', '/v1/api/accounts', payload)

    req.flash('info', `Gateway account ${response.gateway_account_id} generated`)
    res.redirect('/gateway_accounts')
  } catch (error) {
    req.session.recovered = account
    req.flash('error', error.message)
    res.redirect('/gateway_accounts/create')
  }
}

module.exports = { overview, create, confirm, writeAccount }
