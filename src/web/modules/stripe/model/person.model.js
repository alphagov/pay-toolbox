function stripeTestResponsiblePersonDetails () {
  return {
    first_name: 'Jane',
    last_name: 'Doe',
    dob: {
      day: '01',
      month: '01',
      year: '1901'
    },
    relationship: {
      representative: true,
      executive: true,
      title: 'CEO'
    },
    address: {
      line1: 'address_full_match',
      line2: 'WCB',
      city: 'London',
      postal_code: 'E1 8QS',
      country: 'GB'
    },
    phone: '8888675309',
    email: 'test@example.org',
    verification: {
      document: {
        front: 'file_identity_document_success'
      }
    }
  }
}

module.exports = { stripeTestResponsiblePersonDetails }
