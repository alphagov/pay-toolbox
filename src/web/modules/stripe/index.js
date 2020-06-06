// @TODO(sfount) improve TS export -> JS import
const httpBasic = require('./basic/basic.http').default

module.exports = {
  basic: httpBasic.createAccountForm,
  basicCreate: httpBasic.submitAccountCreate
}
