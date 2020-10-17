/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response, NextFunction } from 'express'

import { Ledger, Connector, AdminUsers } from '../../../lib/pay-request'

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        let service, account
        const accountId = req.query.account
        const state = (req.query.status === 'all' ? '' : req.query.status)
        const response = await Ledger.payouts(accountId, state, req.query.page)

        if (req.query.account) {
            service = await AdminUsers.gatewayAccountServices(accountId)
            account = await Connector.account(accountId)
        }

        res.render('ledger_payouts/list', {
            payouts: response.results,
            set: response,
            selectedStatus: (!state ? 'all' : state),
            account,
            service,
            accountId
        })
    } catch (error) {
        next(error)
    }
}
