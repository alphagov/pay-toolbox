import { NextFunction, Request, Response } from 'express'

import { AdminUsers, Connector, Ledger } from '../../../lib/pay-request/client'
import { AccountType } from '../../../lib/pay-request/shared'
import { AgreementListFilterStatus, resolveAgreementStates } from './states'

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

    res.render('agreements/detail', { agreement, service, accounts })
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
      service = await AdminUsers.services.retrieve({gatewayAccountId: accountId as string})
      account = await Connector.accounts.retrieveAPI(accountId as string)
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
