import { Parser } from 'json2csv'
import { Service } from '../../../lib/pay-request/services/admin_users/types'
import _ from 'lodash'
import moment from 'moment'

const fields = [
  {
    label: 'Service ID',
    value: 'id'
  },
  {
    label: 'External ID',
    value: 'external_id'
  },
  {
    label: 'Name',
    value: 'service_name.en'
  },
  {
    label: 'Welsh name',
    value: 'service_name.cy'
  },
  {
    label: 'Organisation',
    value: 'organisation_name'
  },
  {
    label: 'Go live status',
    value: 'current_go_live_stage'
  },
  {
    label: 'Redirect to service on terminal state',
    value: 'redirect_to_service_immediately_on_terminal_state'
  },
  {
    label: 'Experimental features are enabled',
    value: 'experimental_features_enabled'
  },
  {
    label: 'Collect billing address',
    value: 'collect_billing_address'
  },
  {
    label: 'Sector',
    value: 'sector'
  },
  {
    label: 'Is internal service?',
    value: 'internal'
  },
  {
    label: 'Archived',
    value: 'archived'
  },
  {
    label: 'Created date',
    value: 'created_date_string'
  },
  {
    label: 'Went live date',
    value: 'went_live_date_string'
  },
  {
    label: 'Gateway account ids',
    value: 'gateway_account_ids_string'
  }
]

export function formatServiceExportCsv(liveServices: Service[]): string {
  const parser = new Parser({ fields })
  const sortedServices = _.orderBy(liveServices, [
    service => service.id
  ])
  const csvData = sortedServices.map((service, index) => {
      return {
        ...service,
        went_live_date_string: service.went_live_date && moment(service.went_live_date).format('YYYY-MM-DD') || '',
        created_date_string: service.created_date && moment(service.created_date).format('YYYY-MM-DD') || '',
        organisation_name: service.merchant_details && service.merchant_details.name && service.merchant_details.name.trim() || '',
        gateway_account_ids_string: service.gateway_account_ids.join(', ')
      }
    })
  return parser.parse(csvData)
}
