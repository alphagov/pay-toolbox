import { NextFunction, Request, Response } from 'express'

import { AdminUsers, Connector, Webhooks } from '../../../lib/pay-request/client'
import { AccountType } from '../../../lib/pay-request/shared'
import { URL } from 'url'

const {constants} = require('@govuk-pay/pay-js-commons')
const process = require('process')
const {common} = require('./../../../config')

const webhookMessagePageSize = 10

if (common.development) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
}

export async function detail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const webhook = await Webhooks.webhooks.retrieve(
      req.params.id,
      {
        override_account_or_service_id_restriction: true,
      }
    )

    res.render('webhooks/detail', {
      id: req.params.id,
      webhook: webhook,
      human_readable_subscriptions: constants.webhooks.humanReadableSubscriptions,
    })
  } catch (error) {
    next(error)
  }
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
      webhooks: formattedResults,
      isTestData: account.type === AccountType.Test
    })
  } catch (error) {
    next(error)
  }
}

export function search(req: Request, res: Response) {
  res.render('webhooks/search', {csrf: req.csrfToken()})
}

export function searchRequest(req: Request, res: Response) {
  const id = req.body.id.trim()
  res.redirect(`/webhooks/${id}`)
}

export async function listMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
  const page = Number(req.query.page) || 1
  const status = req.query.status as string

  try {
    const webhook = await Webhooks.webhooks.retrieve(
      req.params.id,
      {
        override_account_or_service_id_restriction: true
      }
    )

    const webhookMessages = await Webhooks.webhooks.listMessages(
      req.params.id,
      {
        page: page,
        ...status && { status }
      }
    )

    res.render('webhooks/messages/overview', {
      webhook,
      webhookMessages,
      webhookMessagePageSize,
      page,
      selectedStatus: status,
      human_readable_subscriptions: constants.webhooks.humanReadableSubscriptions,
    })
  } catch (error) {
    next(error)
  }
}

export async function messageDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const webhook = await Webhooks.webhooks.retrieve(req.params.webhookId, { override_account_or_service_id_restriction: true })
    const message = await Webhooks.webhooks.retrieveMessage(req.params.webhookId, req.params.messageId)
    const attempts = await Webhooks.webhooks.listMessageAttempts(req.params.webhookId, req.params.messageId)
    res.render('webhooks/messages/detail', {
      webhook,
      message,
      attempts,
      human_readable_subscriptions: constants.webhooks.humanReadableSubscriptions
    })
  } catch (error) {
    next(error)
  }
}
