/* eslint-disable import/prefer-default-export */
import { Request, Response, NextFunction } from 'express'
import { Transaction } from 'ledger'

import { Ledger } from '../../../lib/pay-request'
import * as logger from '../../../lib/logger'

export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const transaction = await Ledger.transaction(req.params.id) as Transaction
    logger.info(`Fetched transaction ${transaction.charge_id} from Ledger`)
    res.status(200).send()
  } catch (error) {
    next(error)
  }
}
