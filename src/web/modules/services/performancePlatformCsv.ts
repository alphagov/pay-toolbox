import { Parser } from 'json2csv'
import { Service } from '../../../lib/pay-request/services/admin_users/types'
import _ from 'lodash'
import moment from 'moment'

const fields = [
  {
    label: "_timestamp",
    value: "went_live_date"
  }, {
    label: 'service',
    value: 'alwaysdefault',
    default: 'govuk-pay'
  }, {
    label: 'service_id',
    value: 'id'
  }, {
    label: 'agency',
    value: 'agency'
  }, {
    label: 'service_name',
    value: 'service_name'
  }, {
    label: 'count',
    value: 'count',
    default: '1'
  }, {
    label: 'sorting',
    value: 'sorting'
  }
]

export function formatPerformancePlatformCsv(liveServices: Service[]): string {
  const parser = new Parser({ fields })
  const sortedServices = _.orderBy(liveServices, [
    service => service.merchant_details && service.merchant_details.name && service.merchant_details.name.toLowerCase(),
    service => service.service_name.en.toLowerCase(),
    service => service.id
  ])
  const csvData = sortedServices.map((service, index) => {
      return {
        went_live_date: service.went_live_date && moment(service.went_live_date).format('YYYY-MM-DD') || '',
        id: service.id,
        agency: service.merchant_details && service.merchant_details.name && service.merchant_details.name.trim() || '',
        service_name: service.service_name.en.trim(),
        sorting: index + 1
      }
    })
  return parser.parse(csvData)
}
