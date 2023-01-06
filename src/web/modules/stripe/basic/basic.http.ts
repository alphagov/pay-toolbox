import {Request, Response} from 'express'

import logger from '../../../../lib/logger'
import {AdminUsers} from '../../../../lib/pay-request/client'
import {IOValidationError, ValidationError as CustomValidationError} from '../../../../lib/errors'
import {wrapAsyncErrorHandler} from '../../../../lib/routes'
import {ClientFormError, formatErrorsForTemplate} from '../../common/validationErrorFormat'
import {Service} from '../../../../lib/pay-request/services/admin_users/types'
import AccountDetails from './basicAccountDetails.model'
import {setupProductionStripeAccount} from './account'

import Stripe from "stripe";
const {StripeError} = Stripe.errors

const createAccountForm = async function createAccountForm(
  req: Request,
  res: Response
): Promise<void> {
  if (!req.query.service) {
    throw new CustomValidationError('Expected \'service\' query parameter')
  }

  const systemLinkService = req.query.service as string
  const service: Service = await AdminUsers.services.retrieve(systemLinkService)

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

  const {recovered} = req.session
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
  const {systemLinkService} = req.body

  try {
    const service: Service = await AdminUsers.services.retrieve(systemLinkService)
    const accountDetails: AccountDetails = new AccountDetails(req.body)

    const stripeAgreement = await AdminUsers.services.retrieveStripeAgreement(systemLinkService)
    const stripeAccount = await setupProductionStripeAccount(systemLinkService, accountDetails, stripeAgreement)
    res.render('stripe/success', {response: stripeAccount, systemLinkService, service})
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
