import {NextFunction, Request, Response} from 'express'

import {AdminUsers, Connector, Ledger} from '../../../lib/pay-request/typed_clients/client'
import {EntityNotFoundError} from '../../../lib/errors'
import logger from '../../../lib/logger'
import {TransactionType} from "../../../lib/pay-request/typed_clients/shared";
import {PaymentListFilterStatus, resolvePaymentStates, resolveRefundStates} from "./states";

const process = require('process')
const url = require('url')
const https = require('https')
const moment = require('moment')

const {common, services} = require('./../../../config')

if (common.development) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
}

export async function searchPage(req: Request, res: Response): Promise<void> {
  res.render('transactions/search', {csrf: req.csrfToken()})
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  const id = req.body.id && req.body.id.trim()

  try {
    await Ledger.transactions.retrieve(id)

    res.redirect(`/transactions/${id}`)
  } catch (error) {
    if (error instanceof EntityNotFoundError) {
      const referenceSearch = await Ledger.transactions.list({
        override_account_id_restriction: true,
        reference: id
      })

      if (referenceSearch.results.length > 1) {
        res.redirect(`/transactions?reference=${id}`)
        return
      } else if (referenceSearch.results.length === 1) {
        res.redirect(`/transactions/${referenceSearch.results[0].transaction_id}`)
        return
      }

      const gatewayTransactionIdSearch = await Ledger.transactions.list({
        override_account_id_restriction: true,
        gateway_transaction_id: id
      })
      if (gatewayTransactionIdSearch.results.length > 1) {
        res.redirect(`/transactions?gateway_transaction_id=${id}`)
        return
      } else if (gatewayTransactionIdSearch.results.length === 1) {
        res.redirect(`/transactions/${gatewayTransactionIdSearch.results[0].transaction_id}`)
        return
      }

      next(new EntityNotFoundError('Transaction search with criteria ', id))
      return
    }
    next(error)
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let service, account
    const accountId = req.query.account
    const selectedStatus = req.query.status as PaymentListFilterStatus || PaymentListFilterStatus.All
    const transactionType = req.query.type && req.query.type.toString().toUpperCase() as TransactionType || TransactionType.Payment

    const filters = {
      ...req.query.reference && {reference: req.query.reference as string},
      ...req.query.gateway_transaction_id && {gateway_transaction_id: req.query.gateway_transaction_id as string},
      ...req.query.gateway_payout_id && {gateway_payout_id: req.query.gateway_payout_id as string}
    }
    const page = req.query.page && Number(req.query.page) || 1
    const pageSize = 20
    const limitTotalSize = 5000
    const response = await Ledger.transactions.list({
      override_account_id_restriction: !accountId,
      page,
      display_size: pageSize,
      limit_total: true,
      limit_total_size: limitTotalSize,
      ...transactionType && {transaction_type: transactionType as TransactionType},
      ...accountId && {account_id: Number(accountId)},
      ...transactionType === TransactionType.Payment && {payment_states: resolvePaymentStates(selectedStatus)},
      ...transactionType === TransactionType.Refund && {refund_states: resolveRefundStates(selectedStatus)},
      ...filters
    })

    if (req.query.account) {
      service = await AdminUsers.services.retrieve({gatewayAccountId: accountId as string})
      account = await Connector.accounts.retrieveAPI(accountId as string)
    }

    res.render('transactions/list', {
      transactions: response.results,
      selectedStatus,
      filters,
      set: response,
      account,
      service,
      accountId,
      transactionType
    })
  } catch (error) {
    next(error)
  }
}

export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transaction = await Ledger.transactions.retrieve(req.params.id)
    const account = await Connector.accounts.retrieveAPI(transaction.gateway_account_id)
    const service = await AdminUsers.services.retrieve({gatewayAccountId: transaction.gateway_account_id})
    const relatedTransactions = []
    let stripeDashboardUri = ''

    const transactionEvents = await Ledger.transactions.listEvents(transaction.transaction_id, {
      gateway_account_id: transaction.gateway_account_id,
      include_all_events: true
    })

    const events = transactionEvents.events
      .map((event: any) => {
        event.data = Object.keys(event.data).length ? event.data : null
        return event
      })

    const relatedResult = await Ledger.transactions.retrieveRelatedTransactions(transaction.transaction_id,
      {gateway_account_id: transaction.gateway_account_id})
    relatedTransactions.push(...relatedResult.transactions)

    let parentTransaction
    if (transaction.parent_transaction_id) {
      parentTransaction = await Ledger.transactions.retrieve(transaction.parent_transaction_id)
    }

    const renderKey = transaction.transaction_type.toLowerCase()

    if (transaction.gateway_transaction_id && account.payment_provider === 'stripe') {
      stripeDashboardUri = `https://dashboard.stripe.com/${transaction.live ? '' : 'test/'}payments/${transaction.gateway_transaction_id}`
    }

    res.render(`transactions/${renderKey}`, {
      transaction,
      parentTransaction,
      relatedTransactions,
      account,
      service,
      events,
      stripeDashboardUri
    })
  } catch (error) {
    next(error)
  }
}

const sum = (a: number, b: number): number => a + b

export async function statistics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let service
    const accountId = req.query.account as string

    if (req.query.account) {
      service = await AdminUsers.services.retrieve({gatewayAccountId: accountId})
    } else {
      // @TODO(sfount) temporarily disable platform level queries - not supported by Ledger
      throw new Error('Platform statistics not supported by Ledger')
    }

    const periodKeyMap: { [key: string]: string } = {
      today: 'day',
      week: 'week',
      month: 'month'
    }
    const selectedPeriod: any = req.query.period || 'today'
    const momentKey = periodKeyMap[selectedPeriod]

    const fromDate: string = moment().utc().startOf(momentKey).format()
    const toDate: string = moment().utc().endOf(momentKey).format()

    const account = await Connector.accounts.retrieveAPI(accountId);
    const includeMotoStatistics = account.allow_moto;

    const paymentsByState = await Ledger.reports.retrievePaymentSummaryByState({
      account_id: accountId,
      from_date: fromDate,
      to_date: toDate
    })
    const paymentStatistics = await Ledger.reports.retrieveTransactionSummary({
      account_id: accountId,
      override_from_date_validation: true,
      include_moto_statistics: includeMotoStatistics,
      ...fromDate && {from_date: fromDate},
      ...toDate && {to_date: toDate},
    })

    const results = {
      includeMotoStatistics,
      payments: paymentStatistics.payments.count,
      gross: paymentStatistics.payments.gross_amount,
      motoPayments: paymentStatistics.moto_payments.count,
      refunds: paymentStatistics.refunds.count,
      netIncome: paymentStatistics.net_income,
      success: paymentsByState.success,
      error: paymentsByState.error,
      in_progress: [
        paymentsByState.created,
        paymentsByState.started,
        paymentsByState.submitted,
        paymentsByState.capturable
      ].reduce(sum, 0)
    }

    res.render('transactions/statistics', {
      service,
      accountId,
      selectedPeriod,
      results
    })
  } catch (error) {
    next(error)
  }
}

export async function csvPage(req: Request, res: Response, next: NextFunction): Promise<void> {
  const now = moment()
  const years = []
  const totalNumberOfYears = 5

  let service
  const accountId = req.query.account as string

  try {
    if (req.query.account) {
      service = await AdminUsers.services.retrieve({gatewayAccountId: accountId})
    }

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < totalNumberOfYears; i++) years.push(now.year() - i)

    res.render('transactions/csv', {
      accountId,
      service,
      years,
      months: moment.months(),
      csrf: req.csrfToken()
    })
  } catch (error) {
    next(error)
  }
}

export async function streamCsv(req: Request, res: Response, next: NextFunction): Promise<void> {
  const {
    accountId,
    month,
    year,
    includeYear
  } = req.body
  const baseDate = moment()
  const periodCode = includeYear ? 'year' : 'month'

  baseDate.set('year', year)
  baseDate.set('month', month)

  const filters = {
    from_date: baseDate.startOf(periodCode).toISOString(),
    to_date: baseDate.endOf(periodCode).toISOString(),
    display_size: 100000
  }

  const headers = {
    Accept: 'text/csv',
    'Content-Type': 'text/csv'
  }

  let serviceDetails
  let gatewayAccountDetails
  try {
    if (accountId) {
      serviceDetails = await AdminUsers.services.retrieve({gatewayAccountId: accountId})
      gatewayAccountDetails = await Connector.accounts.retrieveAPI(accountId)
    }

    const feeHeaders = gatewayAccountDetails && gatewayAccountDetails.payment_provider === 'stripe'

    const params: any = {
      override_account_id_restriction: true,
      payment_states: '',
      exact_reference_match: true,
      ...filters,
      ...accountId && {account_id: accountId},
      ...feeHeaders && {fee_headers: feeHeaders}
    }

    const accountName = serviceDetails ? serviceDetails.name : 'GOV.UK Platform'
    res.set('Content-Type', 'text/csv')
    res.set('Content-Disposition', `attachment; filename="${accountName} ${includeYear ? '' : moment.months()[month]} ${year}.csv"`)

    const query = Object.keys(params)
      .map((key: string) => `${key}=${params[key]}`)
      .join('&')

    // immediately inform browser of file -- expect ~10s of Ledger database query for 50,000 rows
    res.write('')

    const metricStart = Date.now()
    const target = `${services.LEDGER_URL}/v1/transaction?${query}`
    const parsed = url.parse(target)
    const options = {
      path: `${parsed.pathname}${parsed.search}`,
      host: parsed.hostname,
      port: parsed.port,
      method: 'GET',
      headers
    }

    const request = https.request(options, (response: any) => {
      let count = 0

      response.on('data', (chunk: ArrayBuffer) => {
        count += 1
        res.write(chunk)
      })

      response.on('end', () => {
        const metricEnd = Date.now()
        logger.info('Completed file stream', {
          accountId,
          number_of_chunks: count,
          time_taken: metricEnd - metricStart
        })
        res.end()
      })
    })

    request.on('error', (error: Error) => {
      throw new Error(`Streaming transaction CSV attachment failed ${error.message}`)
    })

    request.end()
  } catch (error) {
    next(error)
  }
}
