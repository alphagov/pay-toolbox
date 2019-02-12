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


const stripeAccount4 = new StripeAccount({
  org_id: 'org_id',
  org_name: 'org_name',
  org_ip_address: 'org_ip_address',
  org_statement_descriptor: 'org_statement_descriptor',
  org_phone_number: 'org_phone_number',
  bank_account_number: '12345678',
  bank_account_sort_code: '123456',
  person_dob_year: 2018,
  person_dob_month: 1,
  person_dob_day: 1
})

//  expect bank acount added
console.log(stripeAccount4)



const stripeAccount5 = new StripeAccount({
  org_id: 'org_id',
  org_name: 'org_name',
  org_ip_address: 'org_ip_address',
  org_statement_descriptor: 'org_statement_descriptor',
  org_phone_number: 'org_phone_number',
  bank_account_number: '12345678',
  bank_account_sort_code: '123456',
  person_dob_year: 2018,
  person_dob_month: 1,
  person_dob_day: 1,
  person_address_line_1: 'line 1',
  person_address_city: 'city',
  person_address_postcode: 'postcode',
  person_first_name: 'joe',
  person_last_name: 'bloggs'
})

//  expect bank acount added
console.log(stripeAccount5)
