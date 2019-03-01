const StripeAccount = require('./stripe.model')

const { expect } = require('chai')

describe('Stripe Account model', () => {
  it('validates model with core details', () => {
    expect(() => {
      const stripeAccount1 = new StripeAccount({
        org_id: 'org_id',
        org_name: 'org_name',
        org_ip_address: 'org_ip_address',
        org_statement_descriptor: 'org_statement_descriptor',
        org_phone_number: 'org_phone_number'
      })
      expect(stripeAccount1).to.be.an('object')
    }).to.not.throw()
  })

  it('ensures no bank account entity with partially provided details', () => {
    const stripeAccount2 = new StripeAccount({
      org_id: 'org_id',
      org_name: 'org_name',
      org_ip_address: 'org_ip_address',
      org_statement_descriptor: 'org_statement_descriptor',
      org_phone_number: 'org_phone_number',
      bank_account_number: '12345678'
    })
    expect(stripeAccount2).to.not.have.property('external_account')
  })

  it('includes bank account with enough details provided', () => {
    const stripeAccount3 = new StripeAccount({
      org_id: 'org_id',
      org_name: 'org_name',
      org_ip_address: 'org_ip_address',
      org_statement_descriptor: 'org_statement_descriptor',
      org_phone_number: 'org_phone_number',
      bank_account_number: '12345678',
      bank_account_sort_code: '123456'
    })
    expect(stripeAccount3).to.have.property('external_account')
  })

  it('includes partial fields for legal entity responsible person', () => {
    // expect(() => {
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
    // }).to.throw('an error')
    expect(stripeAccount4).to.deep.nested.include({
      'legal_entity.dob.day': 1,
      'legal_entity.dob.month': 1,
      'legal_entity.dob.year': 2018
    })
  })

  it('includes full legal entity with all provided fields', () => {
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

    expect(stripeAccount5).to.have.property('legal_entity')
    expect(stripeAccount5).to.have.property('external_account')
    expect(stripeAccount5.legal_entity).to.have.property('personal_address')
  })
})
