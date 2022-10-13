import {NextFunction, Request, Response} from 'express'
import {AdminUsers, Connector} from '../../../../lib/pay-request/client'
import AccountDetails from '../../stripe/basic/basicAccountDetails.model'
import {setupProductionStripeAccount} from '../../stripe/basic/account'
import logger from "../../../../lib/logger";

import stripeTestAccount from '../../stripe/basic/test-account.http'

export async function switchPSPPage(req: Request, res: Response, next: NextFunction) {
  const account = await Connector.accounts.retrieveFrontend(req.params.id)
  const service = await AdminUsers.services.retrieve({gatewayAccountId: account.gateway_account_id})
  res.render('gateway_accounts/switch_psp/switch_psp', {account, service, flash: req.flash(), csrf: req.csrfToken()})
}

export async function postSwitchPSP(req: Request, res: Response, next: NextFunction) {
  const gatewayAccountId = req.params.id
  let stripeCredentials: { stripe_account_id: string }

  try {
    const account = await Connector.accounts.retrieveFrontend(req.params.id)
    const service = await AdminUsers.services.retrieve({gatewayAccountId: gatewayAccountId})

    if (!req.body.paymentProvider) {
      req.flash('error', 'Payment provider is required')
      return res.redirect(`/gateway_accounts/${gatewayAccountId}/switch_psp`)
    }

    if (account.provider_switch_enabled) {
      req.flash('error', 'Cannot configure account that is already switching provider')
      return res.redirect(`/gateway_accounts/${gatewayAccountId}/switch_psp`)
    }

    const {gateway_account_credentials} = account;
    const hasActiveCredentials = gateway_account_credentials && gateway_account_credentials.filter((credential: any) => {
      return credential.state === 'ACTIVE'
    }).length === 1

    if (!hasActiveCredentials) {
      req.flash('error', 'Current payment provider on account is not fully configured. Can only enable provider switching on fully configured account')
      return res.redirect(`/gateway_accounts/${gatewayAccountId}/switch_psp`)
    }

    if (req.body.paymentProvider === 'stripe') {
      if (account.live) {
        // use legacy production stripe account setup, not possible in non-live production environment
        if (!req.body.statementDescriptor) {
          req.flash('error', 'Statement descriptor is required for switching to Stripe')
          return res.redirect(`/gateway_accounts/${req.params.id}/switch_psp`)
        }
        const accountDetails = new AccountDetails(req.body)
        const tosAcceptance = {ip_address: req.ip, agreement_time: Date.now()}
        const stripeAccount = await setupProductionStripeAccount(service.external_id, accountDetails, tosAcceptance)
        stripeCredentials = {stripe_account_id: stripeAccount.id}
      } else {
        // use new stripe account setup and fully configure it for
        const stripeAccount = await stripeTestAccount.createStripeTestAccount(service.service_name.en)

        await Connector.accounts.updateStripeSetup(account.gateway_account_id, {
          bank_account: true,
          company_number: true,
          responsible_person: true,
          vat_number: true,
          director: true,
          organisation_details: true,
          government_entity_document: true
        })
        stripeCredentials = {stripe_account_id: stripeAccount.id}
      }
    }

    await Connector.accounts.update(gatewayAccountId, {
      provider_switch_enabled: true
    })
    await Connector.accounts.addGatewayAccountCredentials(gatewayAccountId, {
      payment_provider: req.body.paymentProvider,
      ...stripeCredentials && { credentials: stripeCredentials }
    })

    logger.info('Provider switch enabled for gateway account', {
      gateway_account_id: account.gateway_account_id,
      gateway_account_type: account.type,
      provider: account.payment_provider,
      new_payment_provider: req.body.paymentProvider
    })

    req.flash('info', 'Switching PSP enabled for gateway account')
    res.redirect(`/gateway_accounts/${req.params.id}`)
  } catch (error) {
    req.flash('error', `Error during setup: ${error.message}`)
    res.redirect(`/gateway_accounts/${req.params.id}/switch_psp`)
  }
}
