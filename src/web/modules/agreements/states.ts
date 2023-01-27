import {ExternalAgreementState, ExternalTransactionState} from "../../../lib/pay-request/shared";

export enum AgreementListFilterStatus {
  Created = 'created', Active = 'active', InActive = 'in-active', All = 'all'
}

const agreementFilterStatusMap: { [key in AgreementListFilterStatus]: ExternalAgreementState[] } = {
  all: [],
  created: [ExternalAgreementState.Created],
  active: [ExternalAgreementState.Active],
  'in-active': [ExternalAgreementState.Cancelled, ExternalAgreementState.Expired]
}

export function resolveAgreementStates(statusFilter: AgreementListFilterStatus) {
  return statusFilter ? agreementFilterStatusMap[statusFilter] : agreementFilterStatusMap.all
}
