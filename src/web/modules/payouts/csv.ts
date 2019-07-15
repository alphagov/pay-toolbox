import { parseAsync } from 'json2csv'
import * as Stripe from 'stripe'

export enum PaymentType {
  PAYMENT = 'PAYMENT',
  REFUND = 'REFUND'
}

// eslint-disable-next-line import/prefer-default-export
export interface PayTransactionCSVEntity {
  payId: string;
  payReference: string;
  transactionDate: Date;
  amount: number;
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

// eslint-disable-next-line import/prefer-default-export
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

  const data = transactions.map(transaction => Object.assign(
    transaction,
    {
      payoutStatus: payout.status && payout.status.toUpperCase(),
      payoutInitiated: new Date(payout.created * 1000).toISOString(),
      payoutEstimatedArrival: new Date(payout.arrival_date * 1000).toISOString(),
      payoutMethod: payout.type && payout.type.toUpperCase(),
      payoutStatementDescriptor:
        payout.statement_descriptor && payout.statement_descriptor.toUpperCase()
    }
  ))
  return parseAsync(data, { fields })
}
