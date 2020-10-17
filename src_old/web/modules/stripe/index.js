const http = require('./stripe.http')
const exceptions = require('./stripe.exceptions')
// @TODO(sfount) improve TS export -> JS import
const httpBasic = require('./basic/basic.http').default

module.exports = {
  create: http.create,
  createAccount: {
    http: http.createAccount,
    exceptions: exceptions.createAccount
  },
  basic: httpBasic.createAccountForm,
  basicCreate: httpBasic.submitAccountCreate
}
