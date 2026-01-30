import Stripe from "stripe";
import {AdminUsers} from '../../../lib/pay-request/client'
import AccountDetails from './accountDetails.model'
import {Service} from '../../../lib/pay-request/services/admin_users/types'
import {ValidationError as CustomValidationError} from '../../../lib/errors'
import logger from '../../../lib/logger'
import * as stripeClient from '../../../lib/stripe/stripe.client'

const STRIPE_ACCOUNT_API_KEY: string = process.env.STRIPE_ACCOUNT_API_KEY || ''

interface TOSAcceptance {
  ip_address: string
  agreement_time: string | number
}

function normalizeUrl(urlString: string): string {
  const url = new URL(urlString)

  url.protocol = url.protocol.toLowerCase()
  url.host = url.host.toLowerCase()

  return url.toString()
}


export async function setupProductionStripeAccount(serviceExternalId: string, stripeAccountDetails: AccountDetails, tosAcceptance: TOSAcceptance): Promise<Stripe.Account> {
  if (!STRIPE_ACCOUNT_API_KEY) {
    throw new CustomValidationError('Stripe API Key was not configured for this Toolbox instance')
  }
  const service: Service = await AdminUsers.services.retrieve(serviceExternalId)
  if (!service.merchant_details || !service.merchant_details.name || !service.merchant_details.address_line1
    || !service.merchant_details.telephone_number) {
    throw new CustomValidationError('Service has no organisation details set or address/telephone number is missing')
  }

  logger.info('Requesting new Stripe account from stripe API')

  const data = {
    type: 'custom',
    country: 'GB',
    business_type: 'government_agency',
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
      url: normalizeUrl(service.merchant_details.url),
      product_description: `Payments for public sector services for organisation ${service.merchant_details.name}`
    },
    capabilities: {
      card_payments: {requested: true},
      transfers: {requested: true},
    },
    tos_acceptance: {
      ip: tosAcceptance.ip_address,
      date: Math.floor(new Date(tosAcceptance.agreement_time).getTime() / 1000)
    }
  };
  // @ts-ignore
  const stripeAccount = await stripeClient.getStripeApi(true).accounts.create(data)
  logger.info(`Stripe API responded with success, account ${stripeAccount.id} created.`)
  return stripeAccount
}
