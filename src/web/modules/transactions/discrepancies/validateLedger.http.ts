import { Request, Response, NextFunction } from 'express'
import {diff, DiffDeleted, DiffEdit, DiffNew} from 'deep-diff'
import { Ledger, Connector } from '../../../../lib/pay-request/client'
import * as _ from 'lodash'
import moment from 'moment'

enum DiffKind {
    Edit = 'E',
    Deleted = 'D',
    New = 'N'
}

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
        switch (obj.kind) {
            case DiffKind.Edit: {
                if (obj.path[0] !== 'created_date') {
                    return true
                } else {
                    const castedDiffObj = obj as DiffEdit<string>
                    const lhsDate = moment(castedDiffObj.lhs)
                    const rhsDate = moment(castedDiffObj.rhs)
                    return Math.abs(lhsDate.diff(rhsDate)) > 5000;
                }
            }
            case DiffKind.Deleted: {
                const castedDeletedObj = obj as DiffDeleted<string>
                return castedDeletedObj.lhs != null;
            }
            case DiffKind.New: {
                const castedNewObj = obj as DiffNew<string>
                return castedNewObj.rhs != null;
            }
        }
    })
    let parityDisplay
    if (parity.length > 0) {
        const diffEdit = parity.filter((obj) => obj.kind === DiffKind.Edit)
        const diffNew = parity.filter((obj) => obj.kind === DiffKind.New)
        const diffDelete = parity.filter((obj) => obj.kind === DiffKind.Deleted)
        if (diffEdit.length > 0) {
            parityDisplay = { 'Fields which have different values': diffEdit }
        }
        if (diffNew.length > 0) {
            parityDisplay = { ...parityDisplay, 'Fields missing from Connector': diffNew }
        }
        if (diffDelete.length > 0) {
            parityDisplay = { ...parityDisplay, 'Fields missing from Ledger': diffDelete }
        }
    }
    res.render('transactions/discrepancies/validateLedger', { ledgerEntry, connectorEntry, parityDisplay, message})
  } catch (error) {
    next(error)
  }

}
