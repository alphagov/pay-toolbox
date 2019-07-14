import { Request, Response, NextFunction } from 'express'
import * as _ from 'lodash'
import * as Stripe from 'stripe'
import * as HTTPSProxyAgent from 'https-proxy-agent'
import { parseAsync } from 'json2csv'

import * as config from '../../../config'
import * as logger from '../../../lib/logger'

import { AdminUsers, Connector } from '../../../lib/pay-request'
import { filenameDate } from '../../../lib/format'
import { verify } from 'crypto';

const stripe = new Stripe(process.env.STRIPE_ACCOUNT_API_KEY)

// @ts-ignore
if (config.server.HTTPS_PROXY) stripe.setHttpAgent(new HTTPSProxyAgent(config.server.HTTPS_PROXY))

enum PaymentType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND'
}

interface MyInterface {
  payId: string;
  payReference: string;
  transactionDate: Date;
  amount: number;
  fee: number;
  net: number;
  type: PaymentType;
  refundForPayId: string;
  gatewayId: string;
}

const payoutReport = async function payoutReport(
  serviceId: string,
  gatewayAccountId: string,
  payout: any,
  stripeAccountId: string
): Promise<string> {
  // @TODO(sfount) pages.js equivalent to not be limited by 100 transactions
  // @ts-ignore
  const transactions = await stripe.balanceTransactions.list({
    limit: 100,
    // payout: payoutId,
    expand: [
      'data.source',
      'data.source.source_transfer'
    ]
  }, {
    stripe_account: stripeAccountId
  })
  const grouped = _.groupBy(transactions.data, 'type')

  const refunds = grouped.transfer
  const payments = grouped.payment

  const formatted: MyInterface[] = []

  const unknownKeys = Object.keys(grouped).filter(key => ![ 'payment', 'transfer', 'payout' ].includes(key))
  if (unknownKeys.length) {
    throw new Error('Unable to exactly match Stripe payout to GOV.UK Pay transactions (unknown types)')
  }

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

  await verifyPayoutTotals(payout as Stripe.payouts.IPayout, formatted)

  const fields = [ {
    label: 'GOV.UK Pay external ID',
    value: 'payId'
  }, {
    label: 'GOV.UK Pay reference',
    value: 'payReference'
  }, {
    label: 'Transaction Type',
    value: 'type'
  }, {
    label: 'Transaction Date',
    value: 'transactionDate'
  }, {
    label: 'Amount',
    value: 'amount'
  }, {
    label: 'Fee',
    value: 'fee'
  }, {
    label: 'Net',
    value: 'net'
  }, {
    label: 'Refunded for GOV.UK Pay external ID',
    value: 'refundForPayId'
  }, {
    label: 'Payment gateway ID',
    value: 'gatewayId'
  }, {
    label: 'Payout status',
    value: 'payoutStatus'
  }, {
    label: 'Payout method',
    value: 'payoutMethod'
  }, {
    label: 'Payout statement descriptor',
    value: 'payoutStatementDescriptor'
  }, {
    label: 'Payout initiated',
    value: 'payoutInitiated'
  }, {
    label: 'Payout estimated arrival',
    value: 'payoutEstimatedArrival'
  } ]

  const data = formatted.map((transaction) => {
    return Object.assign(
      transaction,
      {
        payoutStatus: payout.status.toUpperCase(),
        payoutInitiated: new Date(payout.created * 1000).toISOString(),
        payoutEstimatedArrival: new Date(payout.arrival_date * 1000).toISOString(),
        payoutMethod: payout.type.toUpperCase(),
        payoutStatementDescriptor: payout.statement_descriptor.toUpperCase()
      }
    )
  })
  console.log(data)
  return parseAsync(data, { fields })
}

const verifyPayoutTotals = async function verifyPayoutTotals(payout: Stripe.payouts.IPayout, transactions: MyInterface[]) {
  const grouped = _.groupBy(transactions, 'type')
  const total = _.subtract(_.sumBy(grouped.PAYMENT, 'net'), _.sumBy(grouped.REFUND, 'net'))

  if (total !== payout.amount) {
    throw new Error('Unable to exactly match Stripe payout to GOV.UK Pay transactions (amount)')
  }
}

const getPayDetailsForPayment = async function getPayDetailsForPayment(gatewayAccountId: string, payment: any): Promise<MyInterface> {
  const paymentFromPlatform = payment.source
  const transferFromPlatform = paymentFromPlatform.source_transfer
  const payId = transferFromPlatform.transfer_group
  console.log('Working with')
  console.log(payId)

  const payCharge = await Connector.charge(gatewayAccountId, payId)

  console.log('pay charge')
  console.log(payCharge)

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

const getPayDetailsForRefund = async function getPayDetailsForRefund(gatewayAccountId: string, refund: any):Promise<MyInterface> {
  const payId = refund.source.transfer_group
  console.log(refund)

  const charge = await Connector.charge(gatewayAccountId, payId)
  const refunds = await Connector.refunds(gatewayAccountId, payId)

  // very crude initial pass
  // @TODO(sfount) matching on amount and ~time won't work scalably, the transfer ID should be recorded by Connector
  //               during capture as the refund and transfer are entirely separate processes
  const indexed = _.groupBy(refunds._embedded.refunds, 'amount')
  const match = indexed[Math.abs(refund.amount)]

  if (match.length !== 1) {
    throw new Error(`Unable to process refunds for payment ${payId} (unkown number of matches)`)
  }

  const payRefund = match[0]

  return {
    payId: payRefund.refund_id,
    payReference: charge.reference,
    type: PaymentType.REFUND,
    transactionDate: new Date(payRefund.created_date),
    amount: payRefund.amount,
    fee: 0,
    net: payRefund.amount,
    refundForPayId: refunds.payment_id,
    gatewayId: refund.source.id
  }
}

// eslint-disable-next-line import/prefer-default-export
export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { starting_after, ending_before } = req.query
    const service = await AdminUsers.service(req.params.serviceId)
    const account = await Connector.stripe(req.params.gatewayAccountId)

    // const stripeId = account.stripe_account_id
    const stripeId = 'acct_1DgCqxEWRJVOiyXK'

    const payouts = await stripe.payouts.list({
      limit: 10,
      ...starting_after && { starting_after },
      ...ending_before && { ending_before }
    }, { stripe_account: stripeId })

    console.log(payouts)
    logger.info(`payouts show route invoked ${service.name}`)
    logger.info(stripeId)
    res.render('payouts/payouts_show', { service, payouts, starting_after, ending_before })
  } catch (error) {
    next(error)
  }
}

export async function csv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = await Connector.stripe(req.params.gatewayAccountId)
    const stripeId = account.stripe_account_id

    // const payout = await stripe.payouts.retrieve(req.params.payoutId, { stripe_account: stripeAccountId })
    const payout = {
      amount: 24066,
      status: 'paid',
      created: 1544841742,
      arrival_date: 1545177600,
      type: 'bank_account',
      statement_descriptor: 'GOV.UK Pay'
    }
    // const out = await payoutReport(req.params.serviceId, req.params.gatewayAccountId, req.params.payoutId, stripeId)
    const out = await payoutReport('386d17a43f2142e0ad07eab9f7c86369', '182', payout, 'acct_1EvuXcHstq3ENf6K')
    res.set('Content-Disposition', `attachment; filename=GOVUK_PAY_PAYOUT_${filenameDate(payout.arrival_date)}.csv`)
    res.type('text/csv').send(out)
  } catch (error) {
    next(error)
  }
}
