import { Parser } from 'json2csv'

const fields = [{
  label: 'ID',
  value: 'product.external_id'
}, {
  label: 'Gateway account is live',
  value: 'is_live_account'
}, {
  label: 'Gateway account ID',
  value: 'product.gateway_account_id'
}, {
  label: 'Number of payments',
  value: 'payment_count'
}, {
  label: 'Date last used',
  value: 'last_payment_date'
},{
  label: 'Payment link name',
  value: 'product.name'
}, {
  label: 'Payment link description',
  value: 'product.description'
},{
  label: 'Payment link URL',
  value: 'url'
},{
  label: 'Service name',
  value: 'service_name'
},{
  label: 'Organisation name',
  value: 'organisation_name'
},{
  label: 'Sector',
  value: 'sector'
},{
  label: 'Is fixed price',
  value: 'is_fixed_price'
},{
  label: 'Fixed price',
  value: 'product.price'
},{
  label: 'Custom reference entered',
  value: 'product.reference_enabled'
},{
  label: 'Reference label',
  value: 'product.reference_label'
},{
  label: 'Reference hint',
  value: 'product.reference_hint'
},{
  label: 'Language',
  value: 'product.language'
},{
  label: 'Has metadata',
  value: 'has_metadata'
},{
  label: 'Metadata',
  value: 'product.metadata'
}]

export function format(linksUsage: any): string {
  const parser = new Parser({ fields })
  return parser.parse(linksUsage)
}