import http from './gateway_accounts.http'
import exceptions from './gateway_accounts.exceptions'

export default {
  overview: http.overview,
  listCSV: http.listCSV,
  overviewDirectDebit: http.overviewDirectDebit,
  create: {
    http: http.create,
    exceptions: exceptions.create
  },
  confirm: {
    http: http.confirm,
    exceptions: exceptions.confirm
  },
  writeAccount: {
    http: http.writeAccount,
    exceptions: exceptions.writeAccount
  },
  detail: {
    http: http.detail,
    exceptions: exceptions.detail
  },
  apiKeys: http.apiKeys,
  deleteApiKey: http.deleteApiKey,
  surcharge: http.surcharge,
  updateSurcharge: http.updateSurcharge,
  emailBranding: http.emailBranding,
  updateEmailBranding: http.updateEmailBranding,
  toggleBlockPrepaidCards: http.toggleBlockPrepaidCards,
  toggleMotoPayments: http.toggleMotoPayments,
  updateStripeStatementDescriptorPage: http.updateStripeStatementDescriptorPage,
  updateStripeStatementDescriptor: http.updateStripeStatementDescriptor,
  updateStripePayoutDescriptorPage: http.updateStripePayoutDescriptorPage,
  updateStripePayoutDescriptor: http.updateStripePayoutDescriptor,
  search: http.search,
  searchRequest: http.searchRequest
}
