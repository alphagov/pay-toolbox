const http = require('./stripe.http')
const exceptions = require('./stripe.exceptions')
// @TODO(sfount) improve TS export -> JS import
// eslint-disable-next-line import/no-unresolved
const httpBasic = require('./basic.http').default

module.exports = {
  create: http.create,
  createAccount: {
    http: http.createAccount,
    exceptions: exceptions.createAccount
  },
  basic: httpBasic.createAccountForm,
  basicCreate: httpBasic.submitAccountCreate
}
