/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response, NextFunction } from 'express'

import { Transaction } from 'ledger'

import { Ledger, Connector, AdminUsers } from '../../../lib/pay-request'
import { EntityNotFoundError } from '../../../lib/errors'
import * as logger from '../../../lib/logger'

const moment = require('moment')

export async function searchPage(req: Request, res: Response): Promise<void> {
  res.render('transactions/search', { csrf: req.csrfToken() })
}

// @TODO(sfount) move to `transaction.d.ts` -- resolve JavaScript/ TypeScript module issue
export enum PaymentListFilterStatus {
  'succeeded', 'failed', 'in-progress', 'all'
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  const id = req.body.id && req.body.id.trim()

  try {
    await Ledger.transaction(id)

    res.redirect(`/transactions/${id}`)
  } catch (error) {
    if (error instanceof EntityNotFoundError) {
      const referenceSearch = await Ledger.transactionsByReference(id)

      if (referenceSearch.results.length > 1) {
        res.redirect(`/transactions?reference=${id}`)
      } else if (referenceSearch.results.length === 1) {
        res.redirect(`/transactions/${referenceSearch.results[0].transaction_id}`)
      } else {
        next(new EntityNotFoundError('Transaction search with criteria ', id))
      }
      return
    }
    next(error)
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let account
    const accountId = req.query.account
    const selectedStatus = req.query.status || PaymentListFilterStatus[PaymentListFilterStatus.all]
    const filters = { ...req.query.reference && { reference: req.query.reference } }
    const response = await Ledger.transactions(accountId, req.query.page, selectedStatus, filters)

    if (req.query.account) {
      account = await AdminUsers.gatewayAccountServices(accountId)
    }

    res.render('transactions/list', {
      transactions: response.results,
      selectedStatus,
      filters,
      set: response,
      account,
      accountId
    })
  } catch (error) {
    next(error)
  }
}

export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transaction = await Ledger.transaction(req.params.id) as Transaction
    const account = await Connector.account(transaction.gateway_account_id)
    const service = await AdminUsers.gatewayAccountServices(transaction.gateway_account_id)
    const relatedTransactions = []

    const transactionEvents = await Ledger.events(
      transaction.transaction_id,
      transaction.gateway_account_id
    )
    const events = transactionEvents.events
      .map((event: any) => {
        event.data = Object.keys(event.data).length ? event.data : null
        return event
      })

    if (transaction.refund_summary && transaction.refund_summary.amount_submitted !== 0) {
      const relatedResult = await Ledger.relatedTransactions(
        transaction.transaction_id,
        transaction.gateway_account_id
      )
      relatedTransactions.push(...relatedResult.transactions)
    }

    const renderKey = transaction.transaction_type.toLowerCase()
    res.render(`transactions/${renderKey}`, {
      transaction,
      relatedTransactions,
      account,
      service,
      events
    })
  } catch (error) {
    next(error)
  }
}

const sum = (a: number, b: number): number => a + b

export async function statistics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let account
    const accountId = req.query.account

    if (req.query.account) {
      account = await AdminUsers.gatewayAccountServices(accountId)
    } else {
      // @TODO(sfount) temporarily disable platform level queries - not supported by Ledger
      throw new Error('Platform statistics not supported by Ledger')
    }

    const periodKeyMap: {[key: string]: string} = {
      today: 'day',
      week: 'week',
      month: 'month'
    }
    const selectedPeriod: any = req.query.period || 'today'
    const momentKey = periodKeyMap[selectedPeriod]

    const fromDate: string = moment().utc().startOf(momentKey).format()
    const toDate: string = moment().utc().endOf(momentKey).format()

    const paymentsByState = await Ledger.getPaymentsByState(accountId, fromDate, toDate)
    const paymentStatistics = await Ledger.paymentStatistics(accountId, fromDate, toDate)

    const results = {
      payments: paymentStatistics.payments.count,
      gross: paymentStatistics.payments.gross_amount,
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
      account,
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

  let account
  const accountId = req.query.account

  try {
    if (req.query.account) {
      account = await AdminUsers.gatewayAccountServices(accountId)
    }

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < totalNumberOfYears; i++) years.push(now.year() - i)

    res.render('transactions/csv', {
      accountId,
      account,
      years,
      months: moment.months(),
      csrf: req.csrfToken()
    })
  } catch (error) {
    next(error)
  }
}

export async function csv(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { account, month, year } = req.body
  const baseDate = moment()

  baseDate.set('year', year)
  baseDate.set('month', month)

  const filters = {
    from_date: baseDate.startOf('month').toISOString(),
    to_date: baseDate.endOf('month').toISOString(),
    display_size: 100000
  }

  try {
    let accountDetails
    if (account) {
      accountDetails = await AdminUsers.gatewayAccountServices(account)
    }
    const metricStart = Date.now()
    const result = await Ledger.transactions(account, null, null, filters, true)
    const metricEnd = Date.now()
    const accountName = accountDetails ? accountDetails.name : 'GOV.UK Platform'
    res.set('Content-Type', 'text/csv')
    res.set('Content-Disposition', `attachment; filename="${accountName} ${moment.months()[month]} ${year}.csv"`)

    const numberOfLines = result.split('\n').length

    logger.info(`Transaction CSV downloaded for ${accountName}`, {
      gateway_account: account,
      gateway_account_name: accountName,
      csv_rows: numberOfLines,
      time_taken: metricEnd - metricStart
    })
    res.status(200).send(result)
  } catch (error) {
    next(error)
  }
}
