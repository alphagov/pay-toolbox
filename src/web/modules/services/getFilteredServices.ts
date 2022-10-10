import { BooleanFilterOption } from '../common/BooleanFilterOption'
import { Service } from '../../../lib/pay-request/services/admin_users/types'
import { AdminUsers } from '../../../lib/pay-request/client'

export interface ServiceFilters {
  live: BooleanFilterOption;
  internal: BooleanFilterOption;
  archived: BooleanFilterOption;
}

function serviceAttributeMatchesFilter(filterValue: BooleanFilterOption, serviceValue: Boolean) {
  return filterValue === BooleanFilterOption.True && serviceValue ||
    filterValue === BooleanFilterOption.False && !serviceValue ||
    filterValue === BooleanFilterOption.All
}

export async function fetchAndFilterServices(filters: ServiceFilters): Promise<Service[]> {
  const services: Service[] = await AdminUsers.services.list()
  return services.filter(service =>
    serviceAttributeMatchesFilter(filters.live, service.current_go_live_stage === 'LIVE')
    && serviceAttributeMatchesFilter(filters.internal, service.internal)
    && serviceAttributeMatchesFilter(filters.archived, service.archived)
  )
}

export async function getLiveNotArchivedServices() {
  return await fetchAndFilterServices({
    live: BooleanFilterOption.True,
    internal: BooleanFilterOption.False,
    archived: BooleanFilterOption.False
  })
}
