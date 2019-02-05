const logger = require('./../../../lib/logger')

const STRIPE_API_KEY = process.env.STRIPE_API_KEY
const stripe = require('stripe')(STRIPE_API_KEY)

const StripeAccount = require('./stripe.model')
const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

const { ValidationError } = require('./../../../lib/errors')

const verifyStripeSetup = async function verifyStripeSetup () {
  if (!STRIPE_API_KEY) {
    throw new ValidationError('Stripe API Key was not configured for this Toolbox instance')
  }
  return true
}

const create = async function create (req, res, next) {
  const context = { messages: req.flash('error') }
  await verifyStripeSetup()

  if (req.session.recovered) {
    context.recovered = req.session.recovered
    delete req.session.recovered
  }
  res.render('stripe/create', context)
}

// const wrapStripeAccountCreate = function wrapStripeAccountCreate (account) {
//   return new Promise((resolve, reject) => {
//     stripe.account.create(account
//   })
// }

const createAccount = async function createAccount (req, res, next) {
  await verifyStripeSetup()
  const account = new StripeAccount(req.body)

  // @FIXME(sfount) handle this in exceptions
  try {
    logger.info('Requesting new Stripe account from stripe API')
    const response = await stripe.account.create(account.basicObject())
    logger.info(`Stripe API responded with success, account ${response.id} created.`)
    res.render('stripe/success', { response })
  } catch (error) {
    req.session.recovered = req.body
    logger.error(`Stripe library returned ${error.message}`)
    req.flash('error', error.message)
    res.redirect('/stripe/create')
    // res.status(400).render('common/error', { message: `Stripe account issue: Stripe lib returned: ${error.message}` })
  }
}

const handlers = { create, createAccount }
module.exports = wrapAsyncErrorHandlers(handlers)
