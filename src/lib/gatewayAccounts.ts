/* eslint-disable @typescript-eslint/no-explicit-any */
import { Service } from './pay-request/types/adminUsers'
import { ParsedQs } from 'qs'
import { BooleanFilterOption, toNullableBooleanString } from '../web/modules/common/BooleanFilterOption'

export function aggregateServicesByGatewayAccountId(services: Service[]): { [key: string]: Service } {
  return services
    .reduce((aggregate: { [key: string]: Service }, service: Service) => {
      service.gateway_account_ids.forEach((accountId: string) => {
        aggregate[accountId] = service
      })
      return aggregate
    }, {})
}


export function extractFiltersFromQuery(query: ParsedQs): Filters {
  return {
    live: query.live as BooleanFilterOption || BooleanFilterOption.True,
    provider: query.provider as string,
    three_ds: query.three_ds as BooleanFilterOption || BooleanFilterOption.All,
    apple_pay: query.apple_pay as BooleanFilterOption || BooleanFilterOption.All,
    google_pay: query.google_pay as BooleanFilterOption || BooleanFilterOption.All,
    moto: query.moto as BooleanFilterOption || BooleanFilterOption.All,
  }
}

export interface Filters {
  live: BooleanFilterOption,
  provider: string,
  three_ds: BooleanFilterOption,
  apple_pay: BooleanFilterOption,
  google_pay: BooleanFilterOption,
  moto: BooleanFilterOption
}


export function toAccountSearchParams(filters: Filters) {
  return {
    type: filters.live === BooleanFilterOption.True && 'live' || filters.live === BooleanFilterOption.False && 'test' || null,
    payment_provider: filters.provider,
    requires_3ds: toNullableBooleanString(filters.three_ds),
    apple_pay_enabled: toNullableBooleanString(filters.apple_pay),
    google_pay_enabled: toNullableBooleanString(filters.google_pay),
    moto_enabled: toNullableBooleanString(filters.moto)
  }
}
