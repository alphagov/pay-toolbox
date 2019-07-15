/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import * as Stripe from 'stripe'
import * as HTTPSProxyAgent from 'https-proxy-agent'
import * as _ from 'lodash'

import * as config from '../../../config'
import { renderCSV, PayTransactionCSVEntity, PaymentType } from './csv'
import { Connector } from '../../../lib/pay-request'

const stripe = new Stripe(process.env.STRIPE_ACCOUNT_API_KEY)
stripe.setApiVersion('2018-09-24')

// @ts-ignore
if (config.server.HTTPS_PROXY) stripe.setHttpAgent(new HTTPSProxyAgent(config.server.HTTPS_PROXY))

const getTransactionsForPayout = async function getTransactionsForPayout(
  stripeAccountId: string,
  payout: Stripe.payouts.IPayout
): Promise<Stripe.IList<Stripe.balance.IBalanceTransaction>> {
  const options: Stripe.balance.IBalanceListOptions = {
    limit: 100,
    payout: payout.id,
    expand: [ 'data.source', 'data.source.source_transfer' ]
  }
  // @ts-ignore
  return stripe.balanceTransactions.list(options, { stripe_account: stripeAccountId })
}

const reconcilePayment = async function reconcilePayment(
  gatewayAccountId: string,
  payment: Stripe.balance.IBalanceTransaction
): Promise<PayTransactionCSVEntity> {
  // @ts-ignore
  const transferFromPlatform = payment.source.source_transfer
  const payId = transferFromPlatform.transfer_group
  const payCharge = await Connector.charge(gatewayAccountId, payId)

  return {
    payId: payCharge.charge_id,
    payReference: payCharge.reference,
    type: PaymentType.PAYMENT,
    transactionDate: new Date(payCharge.created_date),
    amount: payCharge.amount,
    fee: payCharge.fee,
    net: payCharge.net_amount,
    refundForPayId: null,
    gatewayId: transferFromPlatform.source_transaction
  }
}

const reconcileRefund = async function reconcileRefund(
  gatewayAccountId: string,
  refund: Stripe.balance.IBalanceTransaction
): Promise<PayTransactionCSVEntity> {
  // @ts-ignore
  const payId = refund.source.transfer_group
  const charge = await Connector.charge(gatewayAccountId, payId)
  const refunds = await Connector.refunds(gatewayAccountId, payId)

  // @TODO(sfount) matching on amount and ~time won't work scalably,
  //               the transfer ID should be recorded by Connector during capture as the refund
  //               and transfer are entirely separate processes
  // eslint-disable-next-line no-underscore-dangle
  const indexed = _.groupBy(refunds._embedded.refunds, 'amount')
  const match = indexed[Math.abs(refund.amount)]

  if (match.length !== 1) {
    throw new Error(`Unable to process refunds for payment ${payId} (unknown number of matches)`)
  }
  const payRefund = match.pop()

  return {
    payId: payRefund.refund_id,
    payReference: charge.reference,
    type: PaymentType.REFUND,
    transactionDate: new Date(payRefund.created_date),
    amount: payRefund.amount,
    fee: 0,
    net: payRefund.amount,
    refundForPayId: refunds.payment_id,
    // @ts-ignore
    gatewayId: refund.source.id
  }
}

const verifyReconciledTotals = async function verifyReconciledTotals(
  payout: Stripe.payouts.IPayout,
  transactions: PayTransactionCSVEntity[]
): Promise<void> {
  const grouped = _.groupBy(transactions, 'type')
  const reconciledAmount = _.subtract(
    _.sumBy(grouped[PaymentType.PAYMENT], 'net'),
    _.sumBy(grouped[PaymentType.REFUND], 'net')
  )

  if (reconciledAmount !== payout.amount) {
    throw new Error('Unable to exactly match Stripe payout to GOV.UK Pay transactions (amount)')
  }
}

const reconcileStripePayTransactions = async function reconcileStripePayTransactions(
  gatewayAccountId: string,
  payout: Stripe.payouts.IPayout,
  transactions: Stripe.IList<Stripe.balance.IBalanceTransaction>
): Promise<PayTransactionCSVEntity[]> {
  const grouped = _.groupBy(transactions.data, 'type')
  const { transfer: refunds, payment: payments } = grouped
  const reconciled: PayTransactionCSVEntity[] = []

  const unknownKeys = Object.keys(grouped).filter(key => ![ 'payment', 'transfer', 'payout' ].includes(key))
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
  payout: Stripe.payouts.IPayout,
  stripeAccountId: string
): Promise<string> {
  // @TODO(sfount) pages.js equivalent to not be limited by 100 transactions
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
): Promise<Stripe.IList<Stripe.payouts.IPayout>> {
  const limitPayoutPageSize = 10
  const options: Stripe.payouts.IPayoutListOptions = {
    limit: limitPayoutPageSize,
    ...startingAfter && { starting_after: startingAfter },
    ...endingBefore && { ending_before: endingBefore }
  }

  return stripe.payouts.list(options, { stripe_account: stripeAccountId })
}

export async function getPayout(
  payoutId: string,
  stripeAccountId: string
): Promise<Stripe.payouts.IPayout> {
  return stripe.payouts.retrieve(payoutId, { stripe_account: stripeAccountId })
}
