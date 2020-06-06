/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import Stripe from 'stripe'
import HTTPSProxyAgent from 'https-proxy-agent'
import _ from 'lodash'

import * as config from '../../../config'
import { renderCSV, PayTransactionCSVEntity, PaymentType } from './csv'
import { reconcilePayment, reconcileRefund } from './payTransaction'
import { getTransactionsForPayout } from './page'

const stripe = new Stripe(process.env.STRIPE_ACCOUNT_API_KEY, {
  apiVersion: '2020-03-02',
  typescript: true,
  ...config.server.HTTPS_PROXY && { httpAgent: new HTTPSProxyAgent(config.server.HTTPS_PROXY) }
})

const verifyReconciledTotals = async function verifyReconciledTotals(
  payout: Stripe.Payout,
  transactions: PayTransactionCSVEntity[]
): Promise<void> {
  const grouped = _.groupBy(transactions, 'type')
  const reconciledAmount = _.subtract(
    _.sumBy(grouped[PaymentType.PAYMENT], 'net'),
    _.sumBy(grouped[PaymentType.REFUND], 'net')
  )

  if (reconciledAmount !== payout.amount) {
    throw new Error(`Unable to exactly match Stripe payout to GOV.UK Pay transactions (amount) [reconciledAmount=${reconciledAmount}] [payoutAmount=${payout.amount}]`)
  }
}

const reconcileStripePayTransactions = async function reconcileStripePayTransactions(
  gatewayAccountId: string,
  payout: Stripe.Payout,
  transactions: Stripe.BalanceTransaction[]
): Promise<PayTransactionCSVEntity[]> {
  const grouped = _.groupBy(transactions, 'type')
  _.minBy(grouped.payment, 'created')
  const { transfer: refunds, payment: payments } = grouped
  const reconciled: PayTransactionCSVEntity[] = []

  const legacyKeys = [ 'payment_refund' ]
  const unknownKeys = Object.keys(grouped).filter((key) => ![ 'payment', 'transfer', 'payout', ...legacyKeys ].includes(key))
  if (unknownKeys.length) {
    throw new Error('Unable to exactly match Stripe payout to GOV.UK Pay transactions (unknown types)')
  }

  if (refunds) {
    for (const refund of refunds) {
      reconciled.push(await reconcileRefund(gatewayAccountId, refund))
    }
  }

  if (payments) {
    for (const payment of payments) {
      reconciled.push(await reconcilePayment(gatewayAccountId, payment))
    }
  }

  await verifyReconciledTotals(payout, reconciled)
  return reconciled
}

export async function buildPayoutCSVReport(
  gatewayAccountId: string,
  payout: Stripe.Payout,
  stripeAccountId: string
): Promise<string> {
  const transactions = await getTransactionsForPayout(stripeAccountId, payout)
  const payTransactions = await reconcileStripePayTransactions(
    gatewayAccountId,
    payout,
    transactions
  )
  return renderCSV(payTransactions, payout)
}

export async function getPayoutsForAccount(
  stripeAccountId: string,
  startingAfter: string,
  endingBefore: string
): Promise<Stripe.ApiList<Stripe.Payout>> {
  const limitPayoutPageSize = 10
  const options: Stripe.PayoutListParams = {
    limit: limitPayoutPageSize,
    ...startingAfter && { starting_after: startingAfter },
    ...endingBefore && { ending_before: endingBefore }
  }

  return stripe.payouts.list(options, { stripe_account: stripeAccountId })
}

export async function getPayout(
  payoutId: string,
  stripeAccountId: string
): Promise<Stripe.Payout> {
  return stripe.payouts.retrieve(payoutId, { stripe_account: stripeAccountId })
}
