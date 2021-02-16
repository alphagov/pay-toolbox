function stripeTestAccountDetails (serviceName) {
  // test Stripe account details as per https://stripe.com/docs/connect/testing
  return {
    type: 'custom',
    country: 'GB',
    business_type: 'company',
    company: {
      name: serviceName,
      address: {
        line1: 'address_full_match',
        line2: 'WCB',
        city: 'London',
        postal_code: 'E1 8QS',
        country: 'GB'
      },
      phone: '+441212345678',
      tax_id: '000000000',
      vat_id: 'NOTAPPLI',
      owners_provided: true,
      directors_provided: true,
      executives_provided: true
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    external_account: {
      object: 'bank_account',
      country: 'GB',
      currency: 'GBP',
      account_holder_name: 'Jane Doe',
      account_holder_type: 'individual',
      routing_number: '108800',
      account_number: '00012345'
    },
    settings: {
      payouts: {
        schedule: { interval: 'daily', delay_days: '7' },
        statement_descriptor: 'TEST ACCOUNT'
      }
    },
    business_profile: {
      mcc: 9399,
      product_description: 'Test account for a service'
    },
    tos_acceptance: {
      ip: '0.0.0.0',
      date: Math.floor(new Date().getTime() / 1000)
    }
  }
}

module.exports = { stripeTestAccountDetails }