import {Request, Response, NextFunction} from 'express'

import {Ledger, Connector, AdminUsers} from '../../../lib/pay-request/client'

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let service, account
    const gatewayAccountId = req.query.account as string
    const state = req.query.status && (req.query.status === 'all' ? '' : req.query.status) as string
    const page = req.query.page && Number(req.query.page)
    const response = await Ledger.payouts.list({
      gateway_account_id: gatewayAccountId,
      state,
      page: page || 1,
      display_size: 20,
      ...!gatewayAccountId && { override_account_id_restriction : true }
    })

    if (req.query.account) {
      service = await AdminUsers.services.retrieve({gatewayAccountId})
      account = await Connector.accounts.retrieve(gatewayAccountId)
    }

    res.render('ledger_payouts/list', {
      payouts: response.results,
      set: response,
      selectedStatus: (!state ? 'all' : state),
      account,
      service,
      accountId: gatewayAccountId
    })
  } catch (error) {
    next(error)
  }
}
