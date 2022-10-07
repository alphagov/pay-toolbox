import { Request, Response, NextFunction } from 'express'
import { diff } from 'deep-diff'
import { Ledger, Connector } from '../../../../lib/pay-request/typed_clients/client'

export async function validateLedgerTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ledgerEntry = await Ledger.transactions.retrieve(req.params.id)
    const connectorEntry = await Connector.charges.retrieveAPI(req.params.id, ledgerEntry.gateway_account_id)
    const parity = diff(connectorEntry, ledgerEntry)

    res.render('transactions/discrepancies/validateLedger', { ledgerEntry, connectorEntry, parity })
  } catch (error) {
    next(error)
  }
}
