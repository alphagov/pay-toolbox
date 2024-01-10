// @TODO(sfount) improve TS export -> JS import
const httpBasic = require('./stripe-account.http').default
const httpBasicTest = require('./test-account.http').default

module.exports = {
  basic: httpBasic.createAccountForm,
  basicCreate: httpBasic.submitAccountCreate,
  createTestAccount: httpBasicTest.createTestAccount,
  createTestAccountConfirm: httpBasicTest.createTestAccountConfirm
}
