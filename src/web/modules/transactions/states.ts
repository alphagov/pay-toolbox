import {ExternalTransactionState} from "../../../lib/pay-request/shared";

export enum PaymentListFilterStatus {
  Succeeded = 'succeeded', Failed = 'failed', InProgress = 'in-progress', All = 'all'
}

const paymentFilterStatusMap: Record<PaymentListFilterStatus, ExternalTransactionState[]> = {
  all: [],
  succeeded: [ExternalTransactionState.Success],
  failed: [ExternalTransactionState.Declined, ExternalTransactionState.TimedOut, ExternalTransactionState.Cancelled, ExternalTransactionState.Error],
  'in-progress': [ExternalTransactionState.Created, ExternalTransactionState.Started, ExternalTransactionState.Submitted, ExternalTransactionState.Capturable]
}
const refundFilterStatusMap: Record<PaymentListFilterStatus, ExternalTransactionState[]> = {
  all: [],
  succeeded: [ExternalTransactionState.Success],
  failed: [ExternalTransactionState.Error],
  'in-progress': [ExternalTransactionState.Submitted]
}

export function resolvePaymentStates(statusFilter: PaymentListFilterStatus) {
  return statusFilter ? paymentFilterStatusMap[statusFilter] : paymentFilterStatusMap.all
}

export function resolveRefundStates(statusFilter: PaymentListFilterStatus) {
  return statusFilter ? refundFilterStatusMap[statusFilter] : paymentFilterStatusMap.all
}
