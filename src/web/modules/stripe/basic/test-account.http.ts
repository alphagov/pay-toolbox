import HTTPSProxyAgent from 'https-proxy-agent'
import { Request, Response, NextFunction } from 'express'

import logger from '../../../../lib/logger'
import * as config from '../../../../config'
import { Connector, AdminUsers } from '../../../../lib/pay-request'
import { ValidationError as CustomValidationError } from '../../../../lib/errors'
import { wrapAsyncErrorHandler } from '../../../../lib/routes'
import { Service } from '../../../../lib/pay-request/types/adminUsers'
import GatewayAccountFormModel from "../../gateway_accounts/gatewayAccount.model";
import { GatewayAccount as CardGatewayAccount } from "../../../../lib/pay-request/types/connector";
// @ts-ignore
import { accounts } from "stripe";
import { stripeTestAccountDetails } from '../model/account.model'
import { stripeTestResponsiblePersonDetails } from '../model/person.model'

const Stripe = require('stripe')
const { StripeError } = Stripe.errors

const STRIPE_ACCOUNT_TEST_API_KEY: string = process.env.STRIPE_ACCOUNT_TEST_API_KEY || ''

const stripeConfig = {}
if (config.server.HTTPS_PROXY) {
  // @ts-ignore
  stripeConfig.httpAgent = new HTTPSProxyAgent(config.server.HTTPS_PROXY)
}

const stripe = new Stripe(STRIPE_ACCOUNT_TEST_API_KEY, {...stripeConfig, 'apiVersion': '2020-08-27'})

const createTestAccount = async function createTestAccount(req: Request, res: Response): Promise<void> {
    if (!STRIPE_ACCOUNT_TEST_API_KEY) {
        throw new CustomValidationError('Stripe test API Key was not configured for this Toolbox instance')
    }

    const serviceExternalId = req.query.service as string
    const service: Service = await AdminUsers.service(serviceExternalId)

    const context = {
        systemLinkService: serviceExternalId,
        serviceName: service.service_name.en,
        csrf: req.csrfToken(),
        flash: req.flash(),
        stripeTestAccountRequested: service.current_psp_test_account_stage === 'REQUEST_SUBMITTED'
    }

    return res.render('stripe/basic/confirm-create-test-account', context)
}

const createTestAccountConfirm = async function createTestAccountConfirm(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { systemLinkService } = req.body
    let service: Service

    try {
        service = await AdminUsers.service(systemLinkService)

        const stripeAccount = await createStripeTestAccount(service.service_name.en)

        const account: CardGatewayAccount = await createTestGatewayAccount(systemLinkService, service.service_name.en, stripeAccount.id)
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
            res.redirect(`/stripe/basic/create-test-account?service=${systemLinkService}`)
        } else {
            next(error)
        }
    }
}

async function createTestGatewayAccount(serviceId: string, serviceName: string, stripeConnectId: string): Promise<CardGatewayAccount> {
    const account = new GatewayAccountFormModel({
        live: 'not-live',
        paymentMethod: 'card',
        description: `Stripe test account for service ${serviceName}`,
        analyticsId: 'Stripe-connect-test-account',
        sector: 'Other',
        serviceName: serviceName,
        provider: 'stripe',
        credentials: stripeConnectId
    })
    account.serviceId = serviceId
    const cardAccount: CardGatewayAccount = await Connector.createAccount(account.formatPayload())
    const gatewayAccountIdDerived = String(cardAccount.gateway_account_id)
    logger.info(`Created new Gateway Account ${gatewayAccountIdDerived}`)

    await Connector.updateStripeSetupValues(gatewayAccountIdDerived, [
        'bank_account',
        'company_number',
        'responsible_person',
        'vat_number',
        'director',
        'organisation_details',
        'government_entity_document'
    ])
    logger.info(`Set Stripe setup values to 'true' for Stripe test Gateway Account ${gatewayAccountIdDerived}`)

    // connect system linked services to the created account
    await AdminUsers.updateServiceGatewayAccount(serviceId, gatewayAccountIdDerived)
    logger.info(`Service ${serviceId} linked to new Gateway Account ${gatewayAccountIdDerived}`)

    await AdminUsers.updateServiceTestPspAccountStageToCreated(serviceId)

    return cardAccount
}

// @ts-ignore
async function createStripeTestAccount(serviceName: string): Promise<accounts> {
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
