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
    const connectorEntry = await Connector.charges.parityCheck(req.params.id, ledgerEntry.gateway_account_id)
    let message
    if (typeof connectorEntry === 'string') {
        message = connectorEntry
    }

    const ledgerResponseWithoutLedgerSpecificFields = _.omit(ledgerEntry, [
    'gateway_account_id',
    'transaction_id',
    'disputed',
    'source',
    'live',
    'transaction_type',
    'credential_external_id',
    'service_id',
    'refund_summary.amount_refunded',
    'evidence_due_date',
    'gateway_payout_id',
    'parent_transaction_id',
    'payment_details',
    'reason'
    ])
    const connectorResponseWithoutConnectorSpecificFields = _.omit(connectorEntry, [
    'links',
    'charge_id',
    'auth_code',
    'authorised_date',
    'payment_outcome',
    'processor_id',
    'provider_id',
    'telephone_number'
    ])

    const parity = diff(connectorResponseWithoutConnectorSpecificFields, ledgerResponseWithoutLedgerSpecificFields).filter(obj => {
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
    res.render('transactions/discrepancies/validateLedger', { ledgerEntry, connectorEntry, parity, message})
  } catch (error) {
    next(error)
  }

}
