import HTTPSProxyAgent from 'https-proxy-agent'
import Stripe from "stripe";

import {NextFunction, Request, Response} from 'express'
import logger from '../../../lib/logger'
import * as config from '../../../config'
import {AdminUsers, Connector} from '../../../lib/pay-request/client'
import {ValidationError as CustomValidationError} from '../../../lib/errors'
import {wrapAsyncErrorHandler} from '../../../lib/routes'
import {PSPTestAccountStage, Service} from '../../../lib/pay-request/services/admin_users/types'
import GatewayAccountFormModel from "../gateway_accounts/gatewayAccount.model";
import {stripeTestAccountDetails} from './model/account.model'
import {stripeTestResponsiblePersonDetails} from './model/person.model'
import {CreateGatewayAccountResponse} from "../../../lib/pay-request/services/connector/types";

const { StripeError } = Stripe.errors

const STRIPE_ACCOUNT_TEST_API_KEY: string = process.env.STRIPE_ACCOUNT_TEST_API_KEY || ''

const stripeConfig: Stripe.StripeConfig = {
  'apiVersion': '2020-08-27'
}
if (config.server.HTTPS_PROXY) {
  // @ts-ignore
  stripeConfig.httpAgent = new HTTPSProxyAgent(config.server.HTTPS_PROXY)
}

const stripe = new Stripe(STRIPE_ACCOUNT_TEST_API_KEY, {...stripeConfig})

const createTestAccount = async function createTestAccount(req: Request, res: Response): Promise<void> {
    if (!STRIPE_ACCOUNT_TEST_API_KEY) {
        throw new CustomValidationError('Stripe test API Key was not configured for this Toolbox instance')
    }

    const serviceExternalId = req.query.service as string
    const service: Service = await AdminUsers.services.retrieve(serviceExternalId)

    const context = {
        systemLinkService: serviceExternalId,
        serviceName: service.service_name.en,
        csrf: req.csrfToken(),
        flash: req.flash(),
        stripeTestAccountRequested: service.current_psp_test_account_stage === 'REQUEST_SUBMITTED'
    }

    return res.render('stripe/confirm-create-test-account', context)
}

const createTestAccountConfirm = async function createTestAccountConfirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { systemLinkService } = req.body
    let service: Service

    try {
        service = await AdminUsers.services.retrieve(systemLinkService)

        const stripeAccount = await createStripeTestAccount(service.service_name.en)

        const account = await createTestGatewayAccount(systemLinkService, service.service_name.en, stripeAccount.id)
        const gatewayAccountIdDerived = String(account.gateway_account_id)
        res.render('gateway_accounts/createSuccess', {
            account: account,
            linkedService: systemLinkService,
            gatewayAccountIdDerived,
            provider: 'stripe',
            isLive: false,
            isStripe: true,
            stripeConnectAccountId: stripeAccount.id
        })
    } catch (error) {
        if (error instanceof StripeError) {
            logger.error(`Stripe Error - ${error.message}`)
            req.flash('error', `Stripe Error: ${error.message}`)
            res.redirect(`/stripe/create-test-account?service=${systemLinkService}`)
        } else {
            next(error)
        }
    }
}

async function createTestGatewayAccount(serviceId: string, serviceName: string, stripeConnectId: string): Promise<CreateGatewayAccountResponse> {
    const account = new GatewayAccountFormModel({
        live: 'not-live',
        description: `Stripe test account for service ${serviceName}`,
        sector: 'Other',
        serviceName: serviceName,
        provider: 'stripe',
        credentials: stripeConnectId
    })
    account.serviceId = serviceId
    const createdAccount = await Connector.accounts.create(account.formatPayload())
    const gatewayAccountIdDerived = String(createdAccount.gateway_account_id)
    logger.info(`Created new Gateway Account ${gatewayAccountIdDerived}`)

    await Connector.accounts.updateStripeSetup(gatewayAccountIdDerived, {
      bank_account: true,
      company_number: true,
      responsible_person: true,
      vat_number: true,
      director: true,
      organisation_details: true,
      government_entity_document: true
    })
    logger.info(`Set Stripe setup values to 'true' for Stripe test Gateway Account ${gatewayAccountIdDerived}`)

    // connect system linked services to the created account
    await AdminUsers.services.update(serviceId, {
      gateway_account_ids: [gatewayAccountIdDerived]
    })
    logger.info(`Service ${serviceId} linked to new Gateway Account ${gatewayAccountIdDerived}`)

    await AdminUsers.services.update(serviceId, {
      current_psp_test_account_stage: PSPTestAccountStage.Created
    })

    return createdAccount
}

async function createStripeTestAccount(serviceName: string): Promise<Stripe.Account> {
    logger.info('Requesting new Stripe test account from stripe API')

    const stripeAccountCreated = await stripe.accounts.create(stripeTestAccountDetails(serviceName))
    await createRepresentative(stripeAccountCreated.id)

    logger.info(`Stripe API responded with success, account ${stripeAccountCreated.id} created.`)
    return stripeAccountCreated
}

async function createRepresentative(connectAccountId: string) {
    await stripe.accounts.createPerson(connectAccountId, stripeTestResponsiblePersonDetails())
}

export default {
    createTestAccount: wrapAsyncErrorHandler(createTestAccount),
    createTestAccountConfirm: wrapAsyncErrorHandler(createTestAccountConfirm),
    createStripeTestAccount
}
