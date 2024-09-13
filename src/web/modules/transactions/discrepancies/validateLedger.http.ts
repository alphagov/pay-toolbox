import { Request, Response, NextFunction } from 'express'
import {diff, DiffEdit} from 'deep-diff'
import { Ledger, Connector } from '../../../../lib/pay-request/client'
import * as _ from 'lodash'
import moment from 'moment'

const EDIT = 'E'

export async function validateLedgerTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ledgerEntry = await Ledger.transactions.retrieve(req.params.id)
    const connectorEntry = await Connector.charges.retrieveAPI(req.params.id, ledgerEntry.gateway_account_id)

    const ledgerPreparedForDiff = _.omit(ledgerEntry, [
      'gateway_account_id',
      'transaction_id',
      'disputed',
      'source',
      'live',
      'transaction_type',
      'credential_external_id',
      'service_id',
      'refund_summary.amount_refunded'
    ])
    const connectorPreparedForDiff = _.omit(connectorEntry, [
        'links',
        'charge_id'
    ])

    const parity = diff(connectorPreparedForDiff, ledgerPreparedForDiff).filter(obj => {
        if (obj.path[0] !== 'created_date' && obj.kind === EDIT) {
            return true
        }
        const castedObj = obj as DiffEdit<string>
        const lhsDate = moment(castedObj.lhs)
        const rhsDate = moment(castedObj.rhs)
        if (Math.abs(lhsDate.diff(rhsDate)) > 10) {
            return true
        }
        return false
    })

    res.render('transactions/discrepancies/validateLedger', { ledgerEntry, connectorEntry, parity })
  } catch (error) {
    next(error)
  }
}
