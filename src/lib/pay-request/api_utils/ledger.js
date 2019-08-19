import { EntityNotFoundError } from '../../errors'

const ledgerMethods = function ledgerMethods(instance) {
  const axiosInstance = instance || this
  const utilExtractData = response => response.data
  const platformAdminQuery = 'override_account_id_restriction=true'
  const includeAllEventsQuery = 'include_all_events=true'

  const transaction = function transaction(id) {
    return axiosInstance.get(`/v1/transaction/${id}?${platformAdminQuery}`)
      .then(utilExtractData)
      .catch((error) => {
        if (error.data.response && error.data.response.status === 404) throw new EntityNotFoundError('Transaction', id)
        throw error
      })
  }

  /* const transactions = function transactions(gatewayAccountId, filters) {
    const overrideFlag = gatewayAccountId ? platformAdminQuery : ''

    // @TODO(sfount) consider and map filters to query params ledger can use
    return axiosInstance.get(`/v1/transaction?${overrideFlag}`)
  }*/

  const transactions = async function transactions(status) {
    // @TODO(sfount) this should enforce `ledger` `PaymentListFilterStatus` when written in TypeScript
    // @TODO(sfount) refunded state is handled in custom ledger search end point - this will have to be looked up separately
    const externalStatusMap = {
      'all': [],
      'succeeded': [ 'success' ],
      'failed': [ 'declined', 'timedout', 'cancelled', 'error' ],
      'in-progress': [ 'created', 'started', 'submitted', 'capturable' ]
    }
    const filters = {
      payment_states: externalStatusMap[status]
    }
    return dummyTransactions
  }

  const events = function events(transactionId, accountId) {
    return axiosInstance.get(`/v1/transaction/${transactionId}/event?gateway_account_id=${accountId}&${includeAllEventsQuery}`)
      .then(utilExtractData)
  }

  return { transaction, transactions, events}
}

module.exports = ledgerMethods

const dummyTransactions = [{
  gateway_account_id: '182',
  amount: 5000,
  total_amount: 5000,
  fee: 100,
  net_amount: 4900,
  state: {
    finished: false,
    status: 'created'
  },
  description: 'Payment for another reason',
  reference: 'PS5WWU5MU7',
  language: 'en',
  return_url: 'https://products.pymnt.uk/payment-complete/5bb037789c23441fa4cd5244cb78940e',
  email: 'payment@example.com',
  payment_provider: 'stripe',
  created_date: '2019-07-26T14:26:27.929Z',
  card_details: {
    cardholder_name: 'Paying user',
    billing_address: {
      line1: '10 Whitechapel High St',
      line2: '',
      postcode: 'E1 8QS',
      city: 'London',
      country: 'GB'
    },
    card_brand: 'visa',
    last_digits_card_number: '3063',
    first_digits_card_number: '400000'
  },
  delayed_capture: false,
  gateway_transaction_id: 'src_1F0UPBHj08j2jFuBOCxJA17T',
  refund_summary: {
    status: null,
    user_external_id: null,
    amount_available: 0,
    amount_submitted: 0
  },
  transaction_id: 'hlf1qq6ka8b0hr2ho7omkpo6ot'
}, {
  gateway_account_id: '182',
  amount: 32500,
  total_amount: 32500,
  fee: 989,
  net_amount: 31511,
  state: {
    finished: false,
    status: 'created'
  },
  description: 'Reconciliation Service Link',
  reference: 'PS5WWU5MU7',
  language: 'en',
  return_url: 'https://products.pymnt.uk/payment-complete/5bb037789c23441fa4cd5244cb78940e',
  email: 'payment@example.com',
  payment_provider: 'stripe',
  created_date: '2019-07-26T14:26:27.929Z',
  card_details: {
    cardholder_name: 'Paying user',
    billing_address: {
      line1: '10 Whitechapel High St',
      line2: '',
      postcode: 'E1 8QS',
      city: 'London',
      country: 'GB'
    },
    card_brand: 'visa',
    last_digits_card_number: '3063',
    first_digits_card_number: '400000'
  },
  delayed_capture: false,
  gateway_transaction_id: 'src_1F0UPBHj08j2jFuBOCxJA17T',
  refund_summary: {
    status: null,
    user_external_id: null,
    amount_available: 0,
    amount_submitted: 0
  },
  transaction_id: 'rs7l0c6ka8b0hr2ho7omkpo6ot'
}, {
  gateway_account_id: '182',
  amount: 32500,
  total_amount: 32500,
  fee: 989,
  net_amount: 31511,
  state: {
    finished: false,
    status: 'created'
  },
  description: 'Reconciliation Service Link',
  reference: 'PS5WWU5MU7',
  language: 'en',
  return_url: 'https://products.pymnt.uk/payment-complete/5bb037789c23441fa4cd5244cb78940e',
  email: 'payment@example.com',
  payment_provider: 'stripe',
  created_date: '2019-07-26T14:26:27.929Z',
  card_details: {
    cardholder_name: 'Paying user',
    billing_address: {
      line1: '10 Whitechapel High St',
      line2: '',
      postcode: 'E1 8QS',
      city: 'London',
      country: 'GB'
    },
    card_brand: 'visa',
    last_digits_card_number: '3063',
    first_digits_card_number: '400000'
  },
  delayed_capture: false,
  gateway_transaction_id: 'src_1F0UPBHj08j2jFuBOCxJA17T',
  refund_summary: {
    status: null,
    user_external_id: null,
    amount_available: 0,
    amount_submitted: 0
  },
  transaction_id: 'rs7l0c6ka8b0hr2ho7omkpo6ot'
}, {
  gateway_account_id: '182',
  amount: 32500,
  total_amount: 32500,
  fee: 989,
  net_amount: 31511,
  state: {
    finished: false,
    status: 'submitted'
  },
  description: 'Reconciliation Service Link',
  reference: 'PS5WWU5MU7',
  language: 'en',
  return_url: 'https://products.pymnt.uk/payment-complete/5bb037789c23441fa4cd5244cb78940e',
  email: 'payment@example.com',
  payment_provider: 'stripe',
  created_date: '2019-07-26T14:26:27.929Z',
  card_details: {
    cardholder_name: 'Paying user',
    billing_address: {
      line1: '10 Whitechapel High St',
      line2: '',
      postcode: 'E1 8QS',
      city: 'London',
      country: 'GB'
    },
    card_brand: 'visa',
    last_digits_card_number: '3063',
    first_digits_card_number: '400000'
  },
  delayed_capture: false,
  gateway_transaction_id: 'src_1F0UPBHj08j2jFuBOCxJA17T',
  refund_summary: {
    status: null,
    user_external_id: null,
    amount_available: 0,
    amount_submitted: 0
  },
  transaction_id: 'rs7l0c6ka8b0hr2ho7omkpo6ot'
}, {
  gateway_account_id: '182',
  amount: 32500,
  total_amount: 32500,
  fee: 989,
  net_amount: 31511,
  state: {
    finished: true,
    status: 'success'
  },
  description: 'Reconciliation Service Link',
  reference: 'PS5WWU5MU7',
  language: 'en',
  return_url: 'https://products.pymnt.uk/payment-complete/5bb037789c23441fa4cd5244cb78940e',
  email: 'payment@example.com',
  payment_provider: 'stripe',
  created_date: '2019-07-26T14:26:27.929Z',
  card_details: {
    cardholder_name: 'Paying user',
    billing_address: {
      line1: '10 Whitechapel High St',
      line2: '',
      postcode: 'E1 8QS',
      city: 'London',
      country: 'GB'
    },
    card_brand: 'visa',
    last_digits_card_number: '3063',
    first_digits_card_number: '400000'
  },
  delayed_capture: false,
  gateway_transaction_id: 'src_1F0UPBHj08j2jFuBOCxJA17T',
  refund_summary: {
    status: null,
    user_external_id: null,
    amount_available: 0,
    amount_submitted: 0
  },
  transaction_id: 'rs7l0c6ka8b0hr2ho7omkpo6ot'
}, {
  gateway_account_id: '182',
  amount: 32500,
  total_amount: 32500,
  fee: 989,
  net_amount: 31511,
  state: {
    finished: true,
    status: 'success'
  },
  description: 'Reconciliation Service Link',
  reference: 'PS5WWU5MU7',
  language: 'en',
  return_url: 'https://products.pymnt.uk/payment-complete/5bb037789c23441fa4cd5244cb78940e',
  email: 'payment@example.com',
  payment_provider: 'stripe',
  created_date: '2019-07-26T14:26:27.929Z',
  card_details: {
    cardholder_name: 'Paying user',
    billing_address: {
      line1: '10 Whitechapel High St',
      line2: '',
      postcode: 'E1 8QS',
      city: 'London',
      country: 'GB'
    },
    card_brand: 'visa',
    last_digits_card_number: '3063',
    first_digits_card_number: '400000'
  },
  delayed_capture: false,
  gateway_transaction_id: 'src_1F0UPBHj08j2jFuBOCxJA17T',
  refund_summary: {
    status: null,
    user_external_id: null,
    amount_available: 0,
    amount_submitted: 0
  },
  transaction_id: 'rs7l0c6ka8b0hr2ho7omkpo6ot'
}, {
  gateway_account_id: '182',
  amount: 32500,
  total_amount: 32500,
  fee: 989,
  net_amount: 31511,
  state: {
    finished: true,
    status: 'cancelled'
  },
  description: 'Reconciliation Service Link',
  reference: 'PS5WWU5MU7',
  language: 'en',
  return_url: 'https://products.pymnt.uk/payment-complete/5bb037789c23441fa4cd5244cb78940e',
  email: 'payment@example.com',
  payment_provider: 'stripe',
  created_date: '2019-07-26T14:26:27.929Z',
  card_details: {
    cardholder_name: 'Paying user',
    billing_address: {
      line1: '10 Whitechapel High St',
      line2: '',
      postcode: 'E1 8QS',
      city: 'London',
      country: 'GB'
    },
    card_brand: 'visa',
    last_digits_card_number: '3063',
    first_digits_card_number: '400000'
  },
  delayed_capture: false,
  gateway_transaction_id: 'src_1F0UPBHj08j2jFuBOCxJA17T',
  refund_summary: {
    status: null,
    user_external_id: null,
    amount_available: 0,
    amount_submitted: 0
  },
  transaction_id: 'rs7l0c6ka8b0hr2ho7omkpo6ot'
}, {
  gateway_account_id: '182',
  amount: 32500,
  total_amount: 32500,
  fee: 989,
  net_amount: 31511,
  state: {
    finished: true,
    status: 'error'
  },
  description: 'Reconciliation Service Link',
  reference: 'PS5WWU5MU7',
  language: 'en',
  return_url: 'https://products.pymnt.uk/payment-complete/5bb037789c23441fa4cd5244cb78940e',
  email: 'payment@example.com',
  payment_provider: 'stripe',
  created_date: '2019-07-26T14:26:27.929Z',
  card_details: {
    cardholder_name: 'Paying user',
    billing_address: {
      line1: '10 Whitechapel High St',
      line2: '',
      postcode: 'E1 8QS',
      city: 'London',
      country: 'GB'
    },
    card_brand: 'visa',
    last_digits_card_number: '3063',
    first_digits_card_number: '400000'
  },
  delayed_capture: false,
  gateway_transaction_id: 'src_1F0UPBHj08j2jFuBOCxJA17T',
  refund_summary: {
    status: null,
    user_external_id: null,
    amount_available: 0,
    amount_submitted: 0
  },
  transaction_id: 'rs7l0c6ka8b0hr2ho7omkpo6ot'
}, {
  gateway_account_id: '182',
  amount: 32500,
  total_amount: 32500,
  fee: 989,
  net_amount: 31511,
  state: {
    finished: true,
    status: 'cancelled'
  },
  description: 'Reconciliation Service Link',
  reference: 'PS5WWU5MU7',
  language: 'en',
  return_url: 'https://products.pymnt.uk/payment-complete/5bb037789c23441fa4cd5244cb78940e',
  email: 'payment@example.com',
  payment_provider: 'stripe',
  created_date: '2019-07-26T14:26:27.929Z',
  card_details: {
    cardholder_name: 'Paying user',
    billing_address: {
      line1: '10 Whitechapel High St',
      line2: '',
      postcode: 'E1 8QS',
      city: 'London',
      country: 'GB'
    },
    card_brand: 'visa',
    last_digits_card_number: '3063',
    first_digits_card_number: '400000'
  },
  delayed_capture: false,
  gateway_transaction_id: 'src_1F0UPBHj08j2jFuBOCxJA17T',
  refund_summary: {
    status: null,
    user_external_id: null,
    amount_available: 0,
    amount_submitted: 0
  },
  transaction_id: 'rs7l0c6ka8b0hr2ho7omkpo6ot'
}, {
  gateway_account_id: '182',
  amount: 32500,
  total_amount: 32500,
  fee: 989,
  net_amount: 31511,
  state: {
    finished: true,
    status: 'cancelled'
  },
  description: 'Reconciliation Service Link',
  reference: 'PS5WWU5MU7',
  language: 'en',
  return_url: 'https://products.pymnt.uk/payment-complete/5bb037789c23441fa4cd5244cb78940e',
  email: 'payment@example.com',
  payment_provider: 'stripe',
  created_date: '2019-07-26T14:26:27.929Z',
  card_details: {
    cardholder_name: 'Paying user',
    billing_address: {
      line1: '10 Whitechapel High St',
      line2: '',
      postcode: 'E1 8QS',
      city: 'London',
      country: 'GB'
    },
    card_brand: 'visa',
    last_digits_card_number: '3063',
    first_digits_card_number: '400000'
  },
  delayed_capture: false,
  gateway_transaction_id: 'src_1F0UPBHj08j2jFuBOCxJA17T',
  refund_summary: {
    status: null,
    user_external_id: null,
    amount_available: 0,
    amount_submitted: 0
  },
  transaction_id: 'rs7l0c6ka8b0hr2ho7omkpo6ot'
}, {
  gateway_account_id: '182',
  amount: 32500,
  total_amount: 32500,
  fee: 989,
  net_amount: 31511,
  state: {
    finished: 'success',
    status: 'cancelled'
  },
  description: 'Reconciliation Service Link',
  reference: 'PS5WWU5MU7',
  language: 'en',
  return_url: 'https://products.pymnt.uk/payment-complete/5bb037789c23441fa4cd5244cb78940e',
  email: 'payment@example.com',
  payment_provider: 'stripe',
  created_date: '2019-07-26T14:26:27.929Z',
  card_details: {
    cardholder_name: 'Paying user',
    billing_address: {
      line1: '10 Whitechapel High St',
      line2: '',
      postcode: 'E1 8QS',
      city: 'London',
      country: 'GB'
    },
    card_brand: 'visa',
    last_digits_card_number: '3063',
    first_digits_card_number: '400000'
  },
  delayed_capture: false,
  gateway_transaction_id: 'src_1F0UPBHj08j2jFuBOCxJA17T',
  refund_summary: {
    status: null,
    user_external_id: null,
    amount_available: 0,
    amount_submitted: 0
  },
  transaction_id: 'rs7l0c6ka8b0hr2ho7omkpo6ot'
}
]