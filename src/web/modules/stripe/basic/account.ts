import Stripe from 'stripe'
import { AdminUsers } from '../../../../lib/pay-request'
import AccountDetails from './basicAccountDetails.model'
import { Service, StripeAgreement } from '../../../../lib/pay-request/types/adminUsers'
import { ValidationError as CustomValidationError } from '../../../../lib/errors'

import logger from '../../../../lib/logger'
import * as stripeClient from '../../../../lib/stripe/stripe.client'
const STRIPE_ACCOUNT_API_KEY: string = process.env.STRIPE_ACCOUNT_API_KEY || ''

export async function setupProductionStripeAccount(serviceExternalId: string, stripeAccountDetails: AccountDetails, stripeAgreement: StripeAgreement): Promise<Stripe.accounts.IAccount> {
  if (!STRIPE_ACCOUNT_API_KEY) {
    throw new CustomValidationError('Stripe API Key was not configured for this Toolbox instance')
  }
  const service: Service = await AdminUsers.service(serviceExternalId)
  if (!service.merchant_details) {
    throw new CustomValidationError('Service has no organisation details set')
  }

  logger.info('Requesting new Stripe account from stripe API')
  const stripeAccount = await stripeClient.getStripeLegacyApiVersion().accounts.create({
    type: 'custom',
    country: 'GB',
    business_name: service.merchant_details.name,
    payout_statement_descriptor: stripeAccountDetails.statementDescriptor,
    statement_descriptor: stripeAccountDetails.statementDescriptor,
    support_phone: service.merchant_details.telephone_number,
    legal_entity: {
      type: 'government_agency',
      business_name: service.merchant_details.name,
      address: {
        line1: service.merchant_details.address_line1,
        line2: service.merchant_details.address_line2,
        city: service.merchant_details.address_city,
        postal_code: service.merchant_details.address_postcode,
        country: service.merchant_details.address_country
      },
      additional_owners: ''
    },
    tos_acceptance: {
      ip: stripeAgreement.ip_address,
      date: Math.floor(new Date(stripeAgreement.agreement_time).getTime() / 1000)
    }
  })
  logger.info(`Stripe API responded with success, account ${stripeAccount.id} created.`)
  return stripeAccount
}
