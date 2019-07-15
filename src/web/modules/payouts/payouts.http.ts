import { Request, Response, NextFunction } from 'express'

import * as logger from '../../../lib/logger'
import { AdminUsers, Connector } from '../../../lib/pay-request'
import { toISODateString } from '../../../lib/format'

import { getPayoutsForAccount, buildPayoutCSVReport, getPayout } from './reconcile'

// eslint-disable-next-line import/prefer-default-export
export async function show(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { startingAfter, endingBefore } = req.query

    const service = await AdminUsers.service(req.params.serviceId)
    const account = await Connector.stripe(req.params.gatewayAccountId)
    const payouts = await getPayoutsForAccount(
      account.stripe_account_id,
      startingAfter,
      endingBefore
    )

    res.render('payouts/payouts_show', {
      service, payouts, startingAfter, endingBefore
    })
  } catch (error) {
    next(error)
  }
}

export async function csv(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const account = await Connector.stripe(req.params.gatewayAccountId)
    const payout = await getPayout(req.params.payoutId, account.stripe_account_id)

    const csvOut: string = await buildPayoutCSVReport(
      req.params.gatewayAccountId,
      payout,
      account.stripe_account_id
    )

    logger.info(`Report for [gatewayAccount=${req.params.gatewayAccountId}] generated for [payoutId=${payout.id}] authorised by ${req.user.username}`)

    res.set('Content-Disposition', `attachment; filename=GOVUK_PAY_PAYOUT_${toISODateString(payout.arrival_date)}.csv`)
    res.type('text/csv').send(csvOut)
  } catch (error) {
    next(error)
  }
}
