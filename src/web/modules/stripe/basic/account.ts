import { AdminUsers } from '../../../../lib/pay-request'
import AccountDetails from './basicAccountDetails.model'
import { Service, StripeAgreement } from '../../../../lib/pay-request/types/adminUsers'
import { ValidationError as CustomValidationError } from '../../../../lib/errors'
import * as config from '../../../../config'
import logger from '../../../../lib/logger'
import HTTPSProxyAgent from "https-proxy-agent"

const STRIPE_ACCOUNT_API_KEY: string = process.env.STRIPE_ACCOUNT_API_KEY || ''

const Stripe = require('stripe-latest')
const {StripeError} = Stripe.errors

const STRIPE_ACCOUNT_TEST_API_KEY: string = process.env.STRIPE_ACCOUNT_TEST_API_KEY || ''

const stripeConfig = {}
if (config.server.HTTPS_PROXY) {
  // @ts-ignore
  stripeConfig.httpAgent = new HTTPSProxyAgent(config.server.HTTPS_PROXY)
}

const stripe = new Stripe(STRIPE_ACCOUNT_TEST_API_KEY, {...stripeConfig, 'apiVersion': '2020-08-27'})

// @ts-ignore
export async function setupProductionStripeAccount(serviceExternalId: string, stripeAccountDetails: AccountDetails, stripeAgreement: StripeAgreement): Promise<Stripe.accounts.IAccount> {
  if (!STRIPE_ACCOUNT_API_KEY) {
    throw new CustomValidationError('Stripe API Key was not configured for this Toolbox instance')
  }
  const service: Service = await AdminUsers.service(serviceExternalId)
  if (!service.merchant_details) {
    throw new CustomValidationError('Service has no organisation details set')
  }

  logger.info('Requesting new Stripe account from stripe API')

  const stripeAccount = await stripe.accounts.create({
    type: 'custom',
    country: 'GB',
    business_type: 'government_entity',
    settings: {
      payments: {
        statement_descriptor: stripeAccountDetails.statementDescriptor,
      },
      payouts: {
        statement_descriptor: stripeAccountDetails.statementDescriptor,
      }
    },
    company: {
      name: service.merchant_details.name,
      address: {
        line1: service.merchant_details.address_line1,
        line2: service.merchant_details.address_line2,
        city: service.merchant_details.address_city,
        postal_code: service.merchant_details.address_postcode,
        country: service.merchant_details.address_country
      },
      phone: service.merchant_details.telephone_number
    },
    business_profile: {
      mcc: 9399,
      url: service.merchant_details.url
    },
    capabilities: {
      card_payments: {requested: true},
      transfers: {requested: true},
    },
    tos_acceptance: {
      ip: stripeAgreement.ip_address,
      date: Math.floor(new Date(stripeAgreement.agreement_time).getTime() / 1000)
    }
  })
  logger.info(`Stripe API responded with success, account ${stripeAccount.id} created.`)
  return stripeAccount
}
