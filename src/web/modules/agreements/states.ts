import {ExternalAgreementState, ExternalTransactionState} from "../../../lib/pay-request/shared";

export enum AgreementListFilterStatus {
  Created = 'created', Active = 'active', Cancelled = 'cancelled', All = 'all'
}

const agreementFilterStatusMap: { [key in AgreementListFilterStatus]: ExternalAgreementState } = {
  all: null,
  created: ExternalAgreementState.Created,
  active: ExternalAgreementState.Active,
  cancelled: ExternalAgreementState.Cancelled
}

export function resolveAgreementStates(statusFilter: AgreementListFilterStatus) {
  return statusFilter ? agreementFilterStatusMap[statusFilter] : agreementFilterStatusMap.all
}
