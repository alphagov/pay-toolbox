const logger = require('./../../../lib/logger')

const STRIPE_API_KEY = process.env.STRIPE_API_KEY
const stripe = require('stripe')(STRIPE_API_KEY)
stripe.setApiVersion('2018-09-24')

const { AdminUsers } = require('./../../../lib/pay-request')
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
  const context = { messages: req.flash('error'), systemLinkService: req.query.service }
  await verifyStripeSetup()

  if (req.session.recovered) {
    context.recovered = req.session.recovered
    delete req.session.recovered
  }
  res.render('stripe/create', context)
}

const createAccount = async function createAccount (req, res, next) {
  await verifyStripeSetup()
  const account = new StripeAccount(req.body)
  const { systemLinkService } = req.body
  const jobs = {}

  // @FIXME(sfount) handle this in exceptions
  try {
    logger.info('Requesting new Stripe account from stripe API')
    jobs.stripeAccount = await stripe.account.create(account.basicObject())
    logger.info(`Stripe API responded with success, account ${jobs.stripeAccount.id} created.`)

    // get the service details if we are linking to the service
    if (systemLinkService) {
      jobs.serviceDetails = await AdminUsers.service(systemLinkService)
    }
    res.render('stripe/success', { response: jobs.stripeAccount, systemLinkService, service: jobs.serviceDetails })
  } catch (error) {
    // @TODO(sfount) recovery doesn't scale
    const recoverSystemLink = systemLinkService ? `?service=${systemLinkService}` : ''
    req.session.recovered = req.body
    logger.error(`Stripe library returned ${error.message}`)
    req.flash('error', error.message)
    res.redirect(`/stripe/create${recoverSystemLink}`)
  }
}

const handlers = { create, createAccount }
module.exports = wrapAsyncErrorHandlers(handlers)
