import { NextFunction, Request, Response } from 'express'

import { AdminUsers, Connector, Webhooks } from '../../../lib/pay-request/client'
import { AccountType } from '../../../lib/pay-request/shared'

const process = require('process')

const {common} = require('./../../../config')

if (common.development) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const accountId = req.query.account

    if (!accountId) {
      throw new Error('Webhooks can currently only be shown for a single account')
    }

    const account = await Connector.accounts.retrieveAPI(accountId as string)
    const service = await AdminUsers.services.retrieve(account.service_id)
    
    const { results } = await Webhooks.webhooks.list({
      service_id: service.external_id,
      live: account.type === AccountType.Live 
    })

    res.render('webhooks/overview', {
      account,
      service,
      webhooks: results
    })
  } catch (error) {
    next(error)
  }
}
