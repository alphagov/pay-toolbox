import { Parser } from 'json2csv'

const fields = [{
  label: 'Gateway account ID',
  value: 'account.gateway_account_id'
}, {
  label: 'Service ID',
  value: 'service.id'
}, {
  label: 'Service external ID',
  value: 'service.external_id'
}, {
  label: 'Type',
  value: 'account.type'
}, {
  label: 'Description',
  value: 'account.description'
}, {
  label: 'Payment provider',
  value: 'account.payment_provider'
}, {
  label: 'Service name (en)',
  value: 'service.service_name.en'
}, {
  label: 'Service name (cy)',
  value: 'service.service_name.cy'
}, {
  label: 'Organisation',
  value: 'service.merchant_details.name'
}, {
  label: 'Analytics ID',
  value: 'account.analytics_id'
}, {
  label: '3DS enabled',
  value: 'account.requires3ds'
}, {
  label: '3DS version',
  value: 'account.integration_version_3ds'
}, {
  label: 'Collect billing address',
  value: 'service.collect_billing_address'
}, {
  label: 'Email collection mode',
  value: 'account.email_collection_mode'
}, {
  label: 'Payment email enabled',
  value: 'payment_email_enabled'
}, {
  label: 'Refund email enabled',
  value: 'refund_email_emailed'
}, {
  label: 'Apple pay enabled',
  value: 'account.allow_apple_pay'
}, {
  label: 'Google pay enabled',
  value: 'account.allow_google_pay'
}, {
  label: 'Block prepaid cards',
  value: 'account.block_prepaid_cards'
}, {
  label: 'MOTO enabled',
  value: 'account.allow_moto'
}, {
  label: 'Allow zero amount',
  value: 'account.allow_zero_amount'
}, {
  label: 'Experimental features enabled',
  value: 'service.experimental_features_enabled'
}, {
  label: 'Uses own error pages',
  value: 'service.redirect_to_service_immediately_on_terminal_state'
}, {
  label: 'Has payment page custom branding',
  value: 'custom_branding'
}, {
  label: 'Has email custom branding',
  value: 'email_branding'
}, {
  label: 'Has corporate card surcharge',
  value: 'corporate_surcharge'
}, {
  label: 'Agent-initiated MOTO payments are enabled',
  value: 'service.agent_initiated_moto_enabled'
}]

export function format(gatewayAccounts: any): string {
  const parser = new Parser({ fields })
  return parser.parse(gatewayAccounts)
}