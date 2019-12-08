import * as Stripe from 'stripe'
import * as _ from 'lodash'

import { PayTransactionCSVEntity, PaymentType } from './csv'
import { Connector } from '../../../lib/pay-request'

export const STRIPE_FEES_FEATURE_TURNED_ON = 1556823600

const legacyPayPayment = async function legacyPayPayment(
  payment: Stripe.balance.IBalanceTransaction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // @ts-ignore
  const transferToAccount = payment.source.source_transfer
  const stripeChargeId = transferToAccount.source_transaction

  // @TODO(sfount) will throw 404, handle this error for a better message
  return Connector.getChargeByGatewayTransactionId(stripeChargeId)
}

const payPayment = async function payPayment(
  payment: Stripe.balance.IBalanceTransaction,
  gatewayAccountId: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // @ts-ignore
  const transferFromPlatform = payment.source.source_transfer
  const payId = transferFromPlatform.transfer_group
  return Connector.charge(gatewayAccountId, payId)
}

const legacyPayRefund = async function legacyPayRefund(
  refund: Stripe.balance.IBalanceTransaction
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // @ts-ignore
  const originalCharge = refund.source.charge
  const stripeChargeId = originalCharge.source_transfer.source_transaction
  return Connector.getChargeByGatewayTransactionId(stripeChargeId)
}

const payRefund = async function payRefund(
  refund: Stripe.balance.IBalanceTransaction,
  gatewayAccountId: string
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  // @ts-ignore
  const payId = refund.source.transfer_group
  return Connector.charge(gatewayAccountId, payId)
}

export async function reconcilePayment(
  gatewayAccountId: string,
  payment: Stripe.balance.IBalanceTransaction
): Promise<PayTransactionCSVEntity> {
  const paymentIsLegacy = payment.created <= STRIPE_FEES_FEATURE_TURNED_ON
  const payCharge = paymentIsLegacy
    ? await legacyPayPayment(payment)
    : await payPayment(payment, gatewayAccountId)

  return {
    payId: payCharge.charge_id,
    payReference: payCharge.reference,
    type: PaymentType.PAYMENT,
    transactionDate: new Date(payCharge.created_date),
    amount: payCharge.amount,
    cardHolderName: payCharge.card_details && payCharge.card_details.cardholder_name,
    fee: payCharge.fee,
    net: payCharge.net_amount || payCharge.amount,
    refundForPayId: null,
    gatewayId: payCharge.gateway_transaction_id
  }
}

export async function reconcileRefund(
  gatewayAccountId: string,
  refund: Stripe.balance.IBalanceTransaction
): Promise<PayTransactionCSVEntity> {
  const refundIsLegacy = refund.created <= STRIPE_FEES_FEATURE_TURNED_ON
  const payCharge = refundIsLegacy
    ? await legacyPayRefund(refund)
    : await payRefund(refund, gatewayAccountId)

  const refunds = await Connector.refunds(gatewayAccountId, payCharge.charge_id)

  // @TODO(sfount) matching on amount and ~time won't work scalably,
  //               the transfer ID should be recorded by Connector during capture as the refund
  //               and transfer are entirely separate processes
  const indexed = _.groupBy(
    // eslint-disable-next-line no-underscore-dangle
    _.filter(refunds._embedded.refunds, [ 'status', 'success' ]),
    'amount'
  )
  const match = indexed[Math.abs(refund.amount)]

  if (match.length !== 1) {
    throw new Error(`Unable to process refunds for payment ${payCharge.charge_id} (unknown number of matches)`)
  }
  const matchedPayRefund = match.pop()

  return {
    payId: matchedPayRefund.refund_id,
    payReference: payCharge.reference,
    type: PaymentType.REFUND,
    transactionDate: new Date(matchedPayRefund.created_date),
    amount: matchedPayRefund.amount,
    cardHolderName: payCharge.card_details && payCharge.card_details.cardholder_name,
    fee: 0,
    net: matchedPayRefund.amount,
    refundForPayId: refunds.payment_id,
    // @ts-ignore
    gatewayId: refund.source.id
  }
}
