import HTTPSProxyAgent from "https-proxy-agent";

const StripeLegacy = require('stripe')
import * as config from '../../config'

const STRIPE_ACCOUNT_API_KEY = process.env.STRIPE_ACCOUNT_API_KEY || ''

let stripeConfig = {}

if (config.server.HTTPS_PROXY) {
  stripeConfig.httpAgent = new HTTPSProxyAgent(config.server.HTTPS_PROXY)
}

const stripeLegacyLib = new StripeLegacy(STRIPE_ACCOUNT_API_KEY, {...stripeConfig, 'apiVersion': '2018-09-24'})

export function getStripeLegacyApiVersion() {
  return stripeLegacyLib
}
