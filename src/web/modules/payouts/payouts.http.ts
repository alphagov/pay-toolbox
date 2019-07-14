import { Request, Response } from 'express'
import * as Stripe from 'stripe'
import * as HTTPSProxyAgent from 'https-proxy-agent'

import * as config from '../../../config'
import * as logger from '../../../lib/logger'

import { AdminUsers, Connector } from '../../../lib/pay-request'

const stripe = new Stripe(process.env.STRIPE_ACCOUNT_API_KEY)

// @ts-ignore
if (config.server.HTTPS_PROXY) stripe.setHttpAgent(new HTTPSProxyAgent(config.server.HTTPS_PROXY))

const payoutReport = async function payoutReport(
  serviceId: string,
  gatewayAccountId: string,
  payoutId: string,
  stripeAccountId: string
): Promise<void> {
  const service = await AdminUsers.service(serviceId)
  const payout = stripe.payouts.retrieve(payoutId)
  const transactions = stripe.balance.listTransactions({ limit: 100 }, { stripe_account: stripeAccountId })

}

// eslint-disable-next-line import/prefer-default-export
export async function show(req: Request, res: Response): Promise<void> {
  const service = await AdminUsers.service(req.params.serviceId)
  const account = await Connector.stripe(req.params.gatewayAccountId)

  const stripeId = account.stripe_account_id

  const payouts = await stripe.payouts.list({ limit: 100 }, { stripe_account: stripeId })

  console.log(payouts)
  logger.info(`payouts show route invoked ${service.name}`)
  logger.info(stripeId)
  res.render('payouts/payouts_show', { service, payouts: payouts.data })
}

export async function csv(req: Request, res: Response): Promise<void> {
  res.set('Content-Disposition', 'attachment; filename=somefilename.csv')
  res.type('text/csv').send('some,files')

}
