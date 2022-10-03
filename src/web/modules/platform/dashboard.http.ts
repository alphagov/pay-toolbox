import {Request, Response, NextFunction} from 'express'

import moment from 'moment'
import {Ledger, AdminUsers} from '../../../lib/pay-request/typed_clients/client'
import {TransactionState} from "../../../lib/pay-request/typed_clients/shared";

export function dashboard(req: Request, res: Response): void {
  res.render('platform/dashboard')
}

export function live(req: Request, res: Response): void {
  res.render('platform/live')
}

function formatISODate(moment: moment.Moment): string {
  return `${moment.format('YYYY-MM-DDTHH:mm:ss.SSSSSS')}Z`
}

export async function timeseries(req: Request, res: Response, next: NextFunction): Promise<void> {
  const {date, fromHour, toHour} = req.query

  try {
    const baseDate = moment(date as string)

    const fromDate = fromHour ?
      baseDate.clone().utc().set('hour', Number(fromHour as string)).startOf('hour') :
      baseDate.clone().utc().startOf('day')

    const toDate = toHour ?
      baseDate.clone().utc().set('hour', Number(toHour as string)).endOf('hour') :
      baseDate.clone().utc().endOf('day')

    const result = await Ledger.reports.listTransactionSummaryByHour({
      from_date: formatISODate(fromDate),
      to_date: formatISODate(toDate)
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}


export async function aggregate(req: Request, res: Response, next: NextFunction): Promise<void> {
  // limit expects an upper limit for the date provided - this can be to millisecond amount
  const {date, state, limit} = req.query

  try {
    const baseDate = moment(date as string)

    const toDate = limit && limit.length ?
      limit as string :
      baseDate.utc().endOf('day').format()

    const result = await Ledger.reports.retrieveLegacyPerformanceSummary({
      from_date: baseDate.utc().startOf('day').format(),
      to_date: toDate,
      state: state as TransactionState
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function ticker(req: Request, res: Response, next: NextFunction): Promise<void> {
  const {from, to} = req.query

  try {
    const result = await Ledger.events.listTicker({
      from_date: from as string,
      to_date: to as string
    })
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

interface GatewayAccountSummary {
  name: string;
  went_live_date: string;
  is_recent: boolean;
}

export async function services(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const services = await AdminUsers.services.list()

    const index = services.reduce((aggregate: { [key: string]: GatewayAccountSummary }, service) => {
      const now = moment()
      let isRecent = false;
      if (service.went_live_date) {
        const numberOfDaysOld = now.diff(moment(service.went_live_date), 'days')
        isRecent = numberOfDaysOld < 30
      }
      const mapped: { [key: string]: GatewayAccountSummary } = {
        ...aggregate,
        ...service.gateway_account_ids.reduce((aggregate: any, accountId: string) => {
          aggregate[accountId] = {
            name: service.service_name.en,
            went_live_date: service.went_live_date,
            is_recent: isRecent
          }
          return aggregate
        }, {})
      }
      return mapped
    }, {})
    res.status(200).json(index)
  } catch (error) {
    next(error)
  }
}
