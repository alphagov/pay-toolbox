/* eslint-disable import/prefer-default-export */
import { Request, Response, NextFunction } from 'express'
import { Transaction } from 'ledger'
import { diff } from 'deep-diff'
import { Ledger, Connector } from '../../../../lib/pay-request'

export async function validateLedgerTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ledgerEntry = await Ledger.transaction(req.params.id) as Transaction
    const connectorEntry = await Connector.charge(ledgerEntry.gateway_account_id, req.params.id)
    const parity = diff(connectorEntry, ledgerEntry)

    res.render('transactions/discrepancies/validateLedger', { ledgerEntry, connectorEntry, parity })
  } catch (error) {
    next(error)
  }
}
