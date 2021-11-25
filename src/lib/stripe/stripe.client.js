import HTTPSProxyAgent from "https-proxy-agent";

const Stripe = require('stripe')
import * as config from '../../config'

const STRIPE_ACCOUNT_API_KEY = process.env.STRIPE_ACCOUNT_API_KEY || ''

let stripeConfig = {}

if (config.server.HTTPS_PROXY) {
  stripeConfig.httpAgent = new HTTPSProxyAgent(config.server.HTTPS_PROXY)
}

const stripeApi = new Stripe(STRIPE_ACCOUNT_API_KEY, {...stripeConfig, 'apiVersion': '2020-08-27'})

export function getStripeApi() {
  return stripeApi
}
