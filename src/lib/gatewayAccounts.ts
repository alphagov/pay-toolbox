import { Service } from './pay-request/types/adminUsers'

export function aggregateServicesByGatewayAccountId(services: Service[]): { [key: string]: Service } {
  return services
    .reduce((aggregate: { [key: string]: Service }, service: Service) => {
      service.gateway_account_ids.forEach((accountId: string) => {
        aggregate[accountId] = service
      })
      return aggregate
    }, {})
}