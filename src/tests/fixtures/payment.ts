import {
  Transaction,
  PaymentProvider,
  CardBrand,
  TransactionStatus
} from 'ledger'

const transaction: Transaction = {
  gateway_account_id: '182',
  amount: 32500,
  total_amount: 32500,
  fee: 989,
  net_amount: 31511,
  state: {
    finished: true,
    status: TransactionStatus.success
  },
  description: 'Reconciliation Service Link',
  reference: 'PS5WWU5MU7',
  language: 'en',
  return_url: 'https://products.pymnt.uk/payment-complete/5bb037789c23441fa4cd5244cb78940e',
  email: 'payment@example.com',
  payment_provider: PaymentProvider.stripe,
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
    card_brand: CardBrand.visa,
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

export default transaction
