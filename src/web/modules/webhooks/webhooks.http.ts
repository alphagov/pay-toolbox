import { NextFunction, Request, Response } from 'express'

import { AdminUsers, Connector, Webhooks } from '../../../lib/pay-request/client'
import { AccountType } from '../../../lib/pay-request/shared'
import { URL } from 'url'

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
    
    const webhooks = await Webhooks.webhooks.list({
      service_id: service.external_id,
      live: account.type === AccountType.Live 
    })

    const formattedResults = webhooks.map(webhook => {
      const callbackDomain = new URL(webhook.callback_url).hostname

      return {
        external_id: webhook.external_id,
        domain: callbackDomain,
        status: webhook.status,
        created_date: webhook.created_date,
      }
    })

    res.render('webhooks/overview', {
      account,
      service,
      webhooks: formattedResults
    })
  } catch (error) {
    next(error)
  }
}
