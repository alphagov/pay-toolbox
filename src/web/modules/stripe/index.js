// @TODO(sfount) improve TS export -> JS import
const httpBasic = require('./basic/basic.http').default
const httpBasicTest = require('./basic/test-account.http').default

module.exports = {
  basic: httpBasic.createAccountForm,
  basicCreate: httpBasic.submitAccountCreate,
  createTestAccount: httpBasicTest.createTestAccount,
  createTestAccountConfirm: httpBasicTest.createTestAccountConfirm
}
