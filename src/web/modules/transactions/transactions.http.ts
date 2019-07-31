/* eslint-disable import/prefer-default-export */
import { Request, Response, NextFunction } from 'express'
import { Transaction } from 'ledger'

import { Ledger, Connector, AdminUsers } from '../../../lib/pay-request'
import * as logger from '../../../lib/logger'

export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transaction = await Ledger.transaction(req.params.id) as Transaction
    const account = await Connector.account(transaction.gateway_account_id)
    const service = await AdminUsers.gatewayAccountServices(transaction.gateway_account_id)
    res.render('transactions/payment', { transaction, account, service })
  } catch (error) {
    next(error)
  }
}
