/* eslint-disable @typescript-eslint/no-explicit-any */
import { Service } from './pay-request/services/admin_users/types'
import { ParsedQs } from 'qs'
import { BooleanFilterOption, toNullableBooleanString } from '../web/modules/common/BooleanFilterOption'
import { ListGatewayAccountsRequest } from './pay-request/services/connector/types'
import { AccountType } from './pay-request/shared'

export function aggregateServicesByGatewayAccountId(services: Service[]): Map<string, Service> {
  return services
    .reduce((accumulator: Map<string, Service>, service: Service) => {
      service.gateway_account_ids.forEach((accountId: string) => {
        accumulator.set(accountId, service)
      })
      return accumulator
    }, new Map())
}


export function extractFiltersFromQuery(query: ParsedQs): Filters {
  return {
    live: query.live as BooleanFilterOption || BooleanFilterOption.True,
    provider: query.provider as string,
    three_ds: query.three_ds as BooleanFilterOption || BooleanFilterOption.All,
    apple_pay: query.apple_pay as BooleanFilterOption || BooleanFilterOption.All,
    google_pay: query.google_pay as BooleanFilterOption || BooleanFilterOption.All,
    moto: query.moto as BooleanFilterOption || BooleanFilterOption.All,
    switching_psp: query.switching_psp as BooleanFilterOption || BooleanFilterOption.All,
    payment_provider_account_id: query.payment_provider_account_id as string,
    recurring: query.recurring as BooleanFilterOption || BooleanFilterOption.All, 
  }
}

export interface Filters {
  live: BooleanFilterOption,
  provider: string,
  three_ds: BooleanFilterOption,
  apple_pay: BooleanFilterOption,
  google_pay: BooleanFilterOption,
  moto: BooleanFilterOption,
  switching_psp: BooleanFilterOption,
  payment_provider_account_id: string
  recurring: BooleanFilterOption
}


export function toAccountSearchParams(filters: Filters): ListGatewayAccountsRequest {
  return {
    type: filters.live === BooleanFilterOption.True && AccountType.Live || filters.live === BooleanFilterOption.False && AccountType.Test || null,
    payment_provider: filters.provider,
    payment_provider_account_id: filters.payment_provider_account_id,
    requires_3ds: toNullableBooleanString(filters.three_ds),
    apple_pay_enabled: toNullableBooleanString(filters.apple_pay),
    google_pay_enabled: toNullableBooleanString(filters.google_pay),
    moto_enabled: toNullableBooleanString(filters.moto),
    provider_switch_enabled: toNullableBooleanString(filters.switching_psp),
    recurring_enabled: toNullableBooleanString(filters.recurring)
  }
}
