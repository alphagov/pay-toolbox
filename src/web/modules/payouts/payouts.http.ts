import { Request, Response, NextFunction } from 'express'

import logger from '../../../lib/logger'
import { AdminUsers, Connector } from '../../../lib/pay-request'
import { toISODateString } from '../../../lib/format'

import { getPayoutsForAccount, buildPayoutCSVReport, getPayout } from './reconcile'
import { renderPayoutListCSV } from './csv'

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
      service, payouts, startingAfter, endingBefore, gatewayAccountId: req.params.gatewayAccountId
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

    logger.info(`Report for [gatewayAccount=${req.params.gatewayAccountId}] generated for [payoutId=${payout.id}] authorised by ${req.user && req.user.username}`)

    res.set('Content-Disposition', `attachment; filename=GOVUK_PAY_PAYOUT_${toISODateString(payout.arrival_date)}.csv`)
    res.type('text/csv').send(csvOut)
  } catch (error) {
    next(error)
  }
}

export async function listPayoutsCsv(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { startingAfter, endingBefore } = req.query
    const service = await AdminUsers.service(req.params.serviceId)
    const account = await Connector.stripe(req.params.gatewayAccountId)
    const payouts = await getPayoutsForAccount(
      account.stripe_account_id,
      startingAfter,
      endingBefore
    )
    const payoutListCSV = await renderPayoutListCSV(payouts.data)

    res.set('Content-Disposition', `attachment; filename=GOVUK_PAY_PAYOUTS_${service.name}.csv`)
    res.type('text/csv').send(payoutListCSV)
  } catch (error) {
    next(error)
  }
}
