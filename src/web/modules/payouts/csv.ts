import { parseAsync } from 'json2csv'
import * as Stripe from 'stripe'

import { toCurrencyString, toISODateString } from '../../../lib/format'

export enum PaymentType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND'
}

export interface PayTransactionCSVEntity {
  payId: string;
  payReference: string;
  transactionDate: Date;
  amount: number;
  cardHolderName: string;
  fee: number;
  net: number;
  type: PaymentType;
  refundForPayId: string;
  gatewayId: string;
  payoutStatus?: string;
  payoutInitiated?: string;
  payoutEstimatedArrival?: string;
  payoutMethod?: string;
  payoutStatementDescriptor?: string;
}

export async function renderCSV(
  transactions: PayTransactionCSVEntity[],
  payout: Stripe.payouts.IPayout
): Promise<string> {
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
    label: 'Payment card holder name',
    value: 'cardHolderName'
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

  const data = transactions.map((transaction) => Object.assign(
    transaction,
    {
      payoutStatus: payout.status && payout.status.toUpperCase(),
      payoutInitiated: new Date(payout.created * 1000).toISOString(),
      payoutEstimatedArrival: new Date(payout.arrival_date * 1000).toISOString(),
      payoutMethod: payout.type && payout.type.toUpperCase(),
      payoutStatementDescriptor:
        payout.statement_descriptor && payout.statement_descriptor.toUpperCase(),
      amount: transaction.type === PaymentType.PAYMENT ? transaction.amount : `-${transaction.amount}`,
      net: transaction.type === PaymentType.PAYMENT ? transaction.net : `-${transaction.net}`
    }
  ))
  return parseAsync(data, { fields })
}

export async function renderPayoutListCSV(
  payouts: Stripe.payouts.IPayout[]
): Promise<string> {
  const fields = [ {
    label: 'Payment gateway ID',
    value: 'id'
  }, {
    label: 'Amount',
    value: 'amount'
  }, {
    label: 'Status',
    value: 'status'
  }, {
    label: 'Statement descriptor',
    value: 'statement_descriptor'
  }, {
    label: 'Initiated',
    value: 'created'
  }, {
    label: 'Est. arrival',
    value: 'arrival_date'
  }, {
    label: 'Reference',
    value: 'fileReference'
  } ]

  const data = payouts.map((payout) => Object.assign(
    payout,
    {
      amount: toCurrencyString(payout.amount / 100),
      status: payout.status.toUpperCase(),
      statement_descriptor: payout.statement_descriptor || '(none)',
      created: new Date(payout.created * 1000).toISOString(),
      arrival_date: new Date(payout.arrival_date * 1000).toISOString(),
      fileReference: `payouts/GOVUK_PAY_PAYOUT_${toISODateString(payout.arrival_date)}.csv`
    }
  ))
  return parseAsync(data, { fields })
}
