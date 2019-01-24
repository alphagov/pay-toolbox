const http = require('./gateway_accounts.http')
const exceptions = require('./gateway_accounts.exceptions')

module.exports = {
  overview: http.overview,
  create: http.create,
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
  deleteApiKey: http.deleteApiKey
}
