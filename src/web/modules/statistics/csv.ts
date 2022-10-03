import {Parser} from "json2csv";

const fields = [{
  label: 'GOV.UK Pay account ID',
  value: 'gateway_account_id'
}, {
  label: 'Service name',
  value: 'service_name'
}, {
  label: 'GOV.UK Pay internal description',
  value: 'description'
}, {
  label: 'Organisation name',
  value: 'organisation_name'
}, {
  label: 'Sector',
  value: 'sector'
}, {
  label: 'Payment service provider',
  value: 'payment_provider'
}, {
  label: 'Service went live date',
  value: 'went_live_date'
}]
const forAllTimeFields = [
  ...fields, {
    label: 'Starting month',
    value: 'starting_month'
  }
]

export function format(reportData: any, months: string[], forAllTime: boolean) {
  const reportFields = forAllTime ? [...forAllTimeFields] : [...fields]
  months.forEach(month => reportFields.push({
    label: month,
    value: month
  }))
  const parser = new Parser({fields: reportFields})
  return parser.parse(reportData)
}
