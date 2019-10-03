/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-param-reassign */
/* eslint-disable import/prefer-default-export */
import { Request, Response, NextFunction } from 'express'

import { Moment } from 'moment'

import { Transaction } from 'ledger'

import { Ledger, Connector, AdminUsers } from '../../../lib/pay-request'
import * as logger from '../../../lib/logger'

let moment = require('moment');

export async function searchPage(req: Request, res: Response): Promise<void> {
  res.render('transactions/search', { csrf: req.csrfToken() })
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.body

    // most basic search implementation - just forward to transactions route
    res.redirect(`/transactions/${id}`)
  } catch (error) {
    next(error)
  }
}

// @TODO(sfount) move to `transaction.d.ts` -- resolve JavaScript/ TypeScript module issue
export enum PaymentListFilterStatus {
  'succeeded', 'failed', 'in-progress', 'all'
}


export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let account
    const accountId = req.query.account
    const selectedStatus = req.query.status || PaymentListFilterStatus[PaymentListFilterStatus.all]
    const response = await Ledger.transactions(accountId, req.query.page, selectedStatus)

    if (req.query.account) {
      account = await AdminUsers.gatewayAccountServices(accountId)
    }

    res.render('transactions/list', {
      transactions: response.results,
      selectedStatus,
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

    const transactionEvents = await Ledger.events(
      transaction.transaction_id,
      transaction.gateway_account_id
    )
    const events = transactionEvents.events
      .map((event: any) => {
        event.data = Object.keys(event.data).length ? event.data : null
        return event
      })
    res.render('transactions/payment', {
      transaction,
      account,
      service,
      events
    })
  } catch (error) {
    next(error)
  }
}

export async function statistics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let account
    const accountId = req.query.account

    if (req.query.account) {
      account = await AdminUsers.gatewayAccountServices(accountId)
    }

    const selectedPeriod: string = req.query.period || 'Today'

    const dateInUTC = moment().utc()
    let fromDate: string;
    let toDate: string;
    switch(selectedPeriod) {
      case 'Today':
        fromDate =  dateInUTC.clone().startOf('day').format()
        toDate = dateInUTC.format()
        break;
      case 'This week':
        fromDate = dateInUTC.clone().startOf('week').format() 
        toDate = dateInUTC.format() 
        break;
      case 'This month':
        fromDate = dateInUTC.clone().startOf('month').format()
        toDate = dateInUTC.format()
        break;
    }
    const override_account_id_restriction: boolean = !accountId

    const response = await Ledger.statistics(accountId, fromDate, toDate, override_account_id_restriction)
    
    // Replace this with DB call
    let payments: number = 0;
    Object.keys(response).forEach(key => {
      payments += response[key]
    })

    const results = {
      payments: payments,
      gross: "£100", // Currently hard-coded
      success: response.success,
      error: response.error,
      in_progress: response.started
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