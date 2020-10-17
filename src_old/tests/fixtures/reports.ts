import { PaymentsByStatusReport, PaymentsReport } from '../../web/modules/transactions/types/reports'

const paymentsByStatusReport: PaymentsByStatusReport = {
  success: 1,
  declined: 1,
  timedout: 1,
  cancelled: 1,
  error: 1,
  created: 1,
  started: 1,
  submitted: 1,
  capturable: 1
}

const paymentsReport: PaymentsReport = {
  count: 100,
  gross_amount: 10000
}

module.exports = {
  paymentsByStatusReport,
  paymentsReport
}

