const http = require('./services.http')
const exceptions = require('./services.exceptions')

module.exports = {
  overview: http.overview,
  detail: {
    http: http.detail,
    exceptions: exceptions.detail
  },
  branding: http.branding,
  updateBranding: http.updateBranding,
  linkAccounts: http.linkAccounts,
  updateLinkAccounts: {
    http: http.updateLinkAccounts,
    exceptions: exceptions.updateLinkAccounts
  },
  search: http.search,
  searchRequest: http.searchRequest
}
