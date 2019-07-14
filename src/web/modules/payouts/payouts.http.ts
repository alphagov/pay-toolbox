import { Request, Response, NextFunction } from 'express'
import * as _ from 'lodash'
import * as Stripe from 'stripe'
import * as HTTPSProxyAgent from 'https-proxy-agent'
import { parseAsync } from 'json2csv'

import * as config from '../../../config'
import * as logger from '../../../lib/logger'

import { AdminUsers, Connector } from '../../../lib/pay-request'
import { runInNewContext } from 'vm';

const stripe = new Stripe(process.env.STRIPE_ACCOUNT_API_KEY)

// @ts-ignore
if (config.server.HTTPS_PROXY) stripe.setHttpAgent(new HTTPSProxyAgent(config.server.HTTPS_PROXY))

enum PaymentType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND'
}

interface MyInterface {
  id: string;
  transactionDate: Date;
  amount: number;
  fee: number;
  net: number;
  type: PaymentType;
  paidOutStatus: boolean;
  payReferenceId: string;
}

const payoutReport = async function payoutReport(
  serviceId: string,
  gatewayAccountId: string,
  payoutId: string,
  stripeAccountId: string
): Promise<string> {
  // const service = await AdminUsers.service(serviceId)
  // const payout = stripe.payouts.retrieve(payoutId)
  // const transactions = stripe.balanceTransactions({ limit: 100, payout: payoutId }, { stripe_account: stripeAccountId })

  // @ts-ignore
  const transactions = await stripe.balanceTransactions.list({
    limit: 100,
    expand: [
      'data.source',
      'data.source.source_transfer'
    ]
  }, { stripe_account: stripeAccountId })
  const grouped = _.groupBy(transactions.data, 'type')

  const refunds = grouped.transfer
  const payments = grouped.payment

  const formatted: MyInterface[] = []

  if (refunds) {
    // eslint-disable-next-line no-restricted-syntax
    for (const refund of refunds) {
      // eslint-disable-next-line no-await-in-loop
      formatted.push(await getPayDetailsForRefund(gatewayAccountId, refund))
    }
  }

  if (payments) {
    // eslint-disable-next-line no-restricted-syntax
    for (const payment of payments) {
      // eslint-disable-next-line no-await-in-loop
      formatted.push(await getPayDetailsForPayment(gatewayAccountId, payment))
    }
  }

  console.log(formatted)

  const fields = [ 'GOV.UK Pay ID', 'Transaction Type', 'Transaction Date', 'Amount', 'Fee', 'Net', 'Paid Out', 'Gateway Payout Reference', 'Payout Initiated', 'Payout Estimated Arrival' ]
  return parseAsync(formatted)
}

const getPayDetailsForPayment = async function getPayDetailsForPayment(gatewayAccountId: string, payment: any):Promise<MyInterface> {
  const paymentFromPlatform = payment.source
  const transferFromPlatform = paymentFromPlatform.source_transfer
  const payId = transferFromPlatform.transfer_group
  console.log('Working with')
  console.log(payId)

  const payCharge = await Connector.charge(gatewayAccountId, payId)

  console.log('pay charge')
  console.log(payCharge)

  return {
    id: payCharge.charge_id,
    type: PaymentType.PAYMENT,
    transactionDate: new Date(payCharge.created_date),
    amount: payCharge.amount,
    fee: payCharge.fee,
    net: payCharge.net_amount,
    paidOutStatus: true,
    payReferenceId: payCharge.charge_id
  }
}

const getPayDetailsForRefund = async function getPayDetailsForRefund(gatewayAccountId: string, refund: any):Promise<MyInterface> {
  const payId = refund.source.transfer_group
  console.log(refund)

  const refunds = await Connector.refunds(gatewayAccountId, payId)

  // very crude initial pass
  // @TODO(sfount) matching on amount and ~time won't work scalably, the transfer ID should be recorded by Connector
  //               during capture as the refund and transfer are entirely separate processes
  const indexed = _.groupBy(refunds._embedded.refunds, 'amount')
  const match = indexed[Math.abs(refund.amount)]

  if (match.length != 1) {
    throw new Error(`Unable to process refunds for payment ${payId} (unkown number of matches)`)
  }

  const payRefund = match[0]

  return {
    id: payRefund.refund_id,
    type: PaymentType.REFUND,
    transactionDate: new Date(payRefund.created_date),
    amount: payRefund.amount,
    fee: 0,
    net: payRefund.amount,
    paidOutStatus: true,
    payReferenceId: refunds.payment_id
  }
}

// eslint-disable-next-line import/prefer-default-export
export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const service = await AdminUsers.service(req.params.serviceId)
    const account = await Connector.stripe(req.params.gatewayAccountId)

    // const stripeId = account.stripe_account_id
    const stripeId = 'acct_1DgCqxEWRJVOiyXK'

    const payouts = await stripe.payouts.list({ limit: 100 }, { stripe_account: stripeId })

    console.log(payouts)
    logger.info(`payouts show route invoked ${service.name}`)
    logger.info(stripeId)
    res.render('payouts/payouts_show', { service, payouts: payouts.data })
  } catch (error) {
    next(error)
  }
}

export async function csv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const out = await payoutReport('386d17a43f2142e0ad07eab9f7c86369', '182', '', 'acct_1EvuXcHstq3ENf6K')
    res.set('Content-Disposition', 'attachment; filename=somefilename.csv')
    res.type('text/csv').send(out)
  } catch (error) {
    next(error)
  }
}
