import Stripe from 'stripe'
import HTTPSProxyAgent from 'https-proxy-agent'
import { Request, Response } from 'express'

import logger from '../../../../lib/logger'
import * as config from '../../../../config'
import { AdminUsers } from '../../../../lib/pay-request'
import { ValidationError as CustomValidationError, IOValidationError } from '../../../../lib/errors'
import { wrapAsyncErrorHandler } from '../../../../lib/routes'
import { formatErrorsForTemplate, ClientFormError } from '../../common/validationErrorFormat'
import { Service, StripeAgreement } from '../../../../lib/pay-request/types/adminUsers'
import AccountDetails from './basicAccountDetails.model'

const { StripeError } = Stripe.errors

const STRIPE_ACCOUNT_API_KEY: string = process.env.STRIPE_ACCOUNT_API_KEY || ''

const stripe = new Stripe(STRIPE_ACCOUNT_API_KEY, {
  apiVersion: '2020-03-02',
  typescript: true,
  ...config.server.HTTPS_PROXY && { httpAgent: new HTTPSProxyAgent(config.server.HTTPS_PROXY) }
})

const createAccountForm = async function createAccountForm(
  req: Request,
  res: Response
): Promise<void> {
  if (!STRIPE_ACCOUNT_API_KEY) {
    throw new CustomValidationError('Stripe API Key was not configured for this Toolbox instance')
  }
  if (!req.query.service) {
    throw new CustomValidationError('Expected \'service\' query parameter')
  }

  const systemLinkService = req.query.service
  const service: Service = await AdminUsers.service(systemLinkService)

  if (service.current_go_live_stage !== 'TERMS_AGREED_STRIPE') {
    throw new CustomValidationError('Service has not completed request to go live and selected Stripe as their PSP')
  }

  const context: {
    errors?: ClientFormError[];
    errorMap?: object;
    formValues?: object;
    systemLinkService: string;
    serviceName: string;
    organisationName: string;
    flash: object;
    csrf: string;
  } = {
    systemLinkService,
    serviceName: service.service_name.en,
    organisationName: service.merchant_details.name,
    flash: req.flash(),
    csrf: req.csrfToken()
  }

  const { recovered } = req.session
  if (recovered) {
    context.formValues = recovered.formValues

    if (recovered.errors) {
      context.errors = recovered.errors
      context.errorMap = recovered.errors.reduce((aggregate: {
        [key: string]: string;
      }, error: ClientFormError) => {
        // eslint-disable-next-line no-param-reassign
        aggregate[error.id] = error.message
        return aggregate
      }, {})
    }
    delete req.session.recovered
  } else {
    // stripe requires a statement descriptor with max length 22
    const defaultStatementDescriptor = service.service_name.en.replace(/[<>'"\\]/g, '').substr(0, 22)
    context.formValues = {
      statementDescriptor: defaultStatementDescriptor
    }
  }
  res.render('stripe/basic/basic', context)
}

const submitAccountCreate = async function submitAccountCreate(
  req: Request,
  res: Response
): Promise<void> {
  const { systemLinkService } = req.body

  try {
    const accountDetails: AccountDetails = new AccountDetails(req.body)

    const service: Service = await AdminUsers.service(systemLinkService)
    if (!service.merchant_details) {
      throw new CustomValidationError('Service has no organisation details set')
    }

    const stripeAgreement: StripeAgreement = await AdminUsers.serviceStripeAgreement(
      systemLinkService
    )

    logger.info('Requesting new Stripe account from stripe API')
    const stripeAccount = await stripe.accounts.create({
      type: 'custom',
      country: 'GB',
      business_profile: {
        name: service.merchant_details.name,
        support_phone: service.merchant_details.telephone_number
      },
      settings: {
        payouts: {
          statement_descriptor: accountDetails.statementDescriptor
        },
        payments: {
          statement_descriptor: accountDetails.statementDescriptor
        }
      },
      business_type: 'government_entity',
      company: {
        name: service.merchant_details.name,
        address: {
          line1: service.merchant_details.address_line1,
          line2: service.merchant_details.address_line2,
          city: service.merchant_details.address_city,
          postal_code: service.merchant_details.address_postcode,
          country: service.merchant_details.address_country
        }
      },
      tos_acceptance: {
        ip: stripeAgreement.ip_address,
        date: Math.floor(new Date(stripeAgreement.agreement_time).getTime() / 1000)
      },
      // sfount: required capabilities for these accounts are [ 'card_payments', 'transfers' ], in order to set these
      //         additional information is required from services to take payments straight away
      requested_capabilities: [ 'legacy_payments' ]
    })
    logger.info(`Stripe API responded with success, account ${stripeAccount.id} created.`)

    res.render('stripe/success', { response: stripeAccount, systemLinkService, service })
  } catch (error) {
    let errors
    if (error instanceof IOValidationError) {
      errors = formatErrorsForTemplate(error.source)
    } else if (error instanceof StripeError) {
      logger.error(`Stripe Error - ${error.stack}`)
      req.flash('error', `Stripe Error: ${error.message}`)
    }
    req.session.recovered = {
      formValues: req.body,
      errors
    }
    res.redirect(`/stripe/basic/create?service=${systemLinkService}`)
  }
}

export default {
  createAccountForm: wrapAsyncErrorHandler(createAccountForm),
  submitAccountCreate: wrapAsyncErrorHandler(submitAccountCreate)
}
