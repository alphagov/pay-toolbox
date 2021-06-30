import { NextFunction, Request, Response } from 'express'
import { Connector, AdminUsers } from '../../../../lib/pay-request'
import AccountDetails from '../../stripe/basic/basicAccountDetails.model'
import { setupProductionStripeAccount } from '../../stripe/basic/account'
import { StripeAgreement } from '../../../../lib/pay-request/types/adminUsers'

export async function switchPSPPage(req: Request, res: Response, next: NextFunction) {
  const account = await Connector.accountWithCredentials(req.params.id)
  const service = await AdminUsers.gatewayAccountServices(account.gateway_account_id)
  res.render('gateway_accounts/switch_psp/switch_psp', { account, service, flash: req.flash(), csrf: req.csrfToken() })
}

export async function postSwitchPSP(req: Request, res: Response, next: NextFunction) {
  const gatewayAccountId = req.params.id
  let credentials: { stripe_account_id?: string }

  try {
    const account = await Connector.accountWithCredentials(req.params.id)
    const service = await AdminUsers.gatewayAccountServices(gatewayAccountId)

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
      if (!req.body.statementDescriptor) {
        req.flash('error', 'Statement descriptor is required for switching to Stripe')
        return res.redirect(`/gateway_accounts/${req.params.id}/switch_psp`)
      }
      const accountDetails = new AccountDetails(req.body)
      const ipAddress = (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].toString()) || (req.socket.remoteAddress && req.socket.remoteAddress.toString())
      const switchProxyAgreement: StripeAgreement = { ip_address: ipAddress, agreement_time: Date.now() }
      const stripeAccount = await setupProductionStripeAccount(service.external_id, accountDetails, switchProxyAgreement)
      credentials = { stripe_account_id: stripeAccount.id }
    }

    await Connector.enableSwitchFlagOnGatewayAccount(gatewayAccountId)
    await Connector.addGatewayAccountCredentialsForSwitch(gatewayAccountId, req.body.paymentProvider, credentials)

    req.flash('info', 'Switching PSP enabled for gateway account')
    res.redirect(`/gateway_accounts/${req.params.id}`)
  } catch (error) {
    req.flash('error', `Error during setup: ${error.message}`)
    res.redirect(`/gateway_accounts/${req.params.id}/switch_psp`)
  }
}
