import { NextFunction, Request, Response } from 'express'

import { AdminUsers, Connector, Ledger } from '../../../lib/pay-request/client'
import { AccountType } from '../../../lib/pay-request/shared'
import { AgreementListFilterStatus, resolveAgreementStates } from './states'
import {EntityNotFoundError} from '../../../lib/errors'

const process = require('process')

const {common} = require('./../../../config')

if (common.development) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const agreement = await Ledger.agreements.retrieve(req.params.id, { override_account_or_service_id_restriction: true })
    const { accounts } = await Connector.accounts.list({
      serviceIds: agreement.service_id,
      type: agreement.live ? AccountType.Live : AccountType.Test
    })
    const service = await AdminUsers.services.retrieve(agreement.service_id)

    const agreementEvents = await Ledger.agreements.listEvents(agreement.external_id, {
      service_id: agreement.service_id,
      include_all_events: true
    })

    const events = agreementEvents.events
      .map((event: any) => {
        event.data = Object.keys(event.data).length ? event.data : null
        return event
      })

    res.render('agreements/detail', { agreement, service, accounts, events })
  } catch (error) {
    next(error)
  }
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let service, account
    const accountId = req.query.account
    const selectedStatus = req.query.status as AgreementListFilterStatus || AgreementListFilterStatus.All

    const filters = {
      ...req.query.reference && {reference: req.query.reference as string}
    }
    const page = req.query.page && Number(req.query.page) || 1
    const pageSize = 20
    const limitTotalSize = 5000


    const response = await Ledger.agreements.list({
      override_account_or_service_id_restriction: !accountId,
      page,
      display_size: pageSize,
      limit_total: true,
      limit_total_size: limitTotalSize,
      ...accountId && {account_id: Number(accountId)},
      status: resolveAgreementStates(selectedStatus),
      ...filters
    })

    if (req.query.account) {
      service = await AdminUsers.services.retrieveByGatewayAccountId(`${accountId}`)
      account = await Connector.accounts.retrieve(accountId as string)
    }

    res.render('agreements/list', {
      agreements: response.results,
      selectedStatus,
      filters,
      set: response,
      account,
      service,
      accountId
    })
  } catch (error) {
    next(error)
  }
}

export async function searchPage(req: Request, res: Response): Promise<void> {
  res.render('agreements/search', {csrf: req.csrfToken()})
}

export async function search(req: Request, res: Response, next: NextFunction): Promise<void> {
  const id = req.body.id && req.body.id.trim()

  try {
    await Ledger.agreements.retrieve(id, { override_account_or_service_id_restriction: true })
    res.redirect(`/agreements/${id}`)
  } catch (error) {
    if (error instanceof EntityNotFoundError) {
      const referenceSearch = await Ledger.agreements.list({
        override_account_or_service_id_restriction: true,
        reference: id
      })

      if (referenceSearch.results.length > 1) {
        res.redirect(`/agreements?reference=${id}`)
        return
      } else if (referenceSearch.results.length === 1) {
        res.redirect(`/agreements/${referenceSearch.results[0].external_id}`)
        return
      }

      next(new EntityNotFoundError('Agreement search with criteria ', id))
      return
    }
    next(error)
  }
}
