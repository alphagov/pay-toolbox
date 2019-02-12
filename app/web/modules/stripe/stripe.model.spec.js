const StripeAccount = require('./stripe.model')

// @TODO(mrlumbu) Make these proper
const stripeAccount1 = new StripeAccount({
  org_id: 'org_id',
  org_name: 'org_name',
  org_ip_address: 'org_ip_address',
  org_statement_descriptor: 'org_statement_descriptor',
  org_phone_number: 'org_phone_number'
})

console.log(stripeAccount1)

const stripeAccount2 = new StripeAccount({
  org_id: 'org_id',
  org_name: 'org_name',
  org_ip_address: 'org_ip_address',
  org_statement_descriptor: 'org_statement_descriptor',
  org_phone_number: 'org_phone_number',
  bank_account_number: '12345678'
})

//  expect no bank acount still
console.log(stripeAccount2)

const stripeAccount3 = new StripeAccount({
  org_id: 'org_id',
  org_name: 'org_name',
  org_ip_address: 'org_ip_address',
  org_statement_descriptor: 'org_statement_descriptor',
  org_phone_number: 'org_phone_number',
  bank_account_number: '12345678',
  bank_account_sort_code: '123456'
})

//  expect bank acount added
console.log(stripeAccount3)
