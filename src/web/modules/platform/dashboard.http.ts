import { Request, Response, NextFunction } from 'express'

import moment from 'moment'
import { Ledger, AdminUsers } from './../../../lib/pay-request'

export function dashboard(req: Request, res: Response): void {
  res.render('platform/dashboard')
}

export function live(req: Request, res: Response): void {
  res.render('platform/live')
}

function formatISODate(moment: moment.Moment): string {
  return `${moment.format('YYYY-MM-DDTHH:mm:ss.SSSSSS')}Z`
}

// API
export async function timeseries(req: Request, res: Response, next: NextFunction): Promise<void> {
  // hours expects an array of 0 indexed hours
  const { date, fromHour, toHour } = req.query

  try {
    const baseDate = moment(date)

    const fromDate = fromHour ?
      baseDate.clone().utc().set('hour', fromHour).startOf('hour') :
      baseDate.clone().utc().startOf('day')

    const toDate = toHour ?
      baseDate.clone().utc().set('hour', toHour).endOf('hour') :
      baseDate.clone().utc().endOf('day')

    const result = await Ledger.paymentVolumesByHour(
      formatISODate(fromDate),
      formatISODate(toDate)
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}


// @FIXME(sfount) support state flag to differentiate all vs. successful
export async function aggregate(req: Request, res: Response, next: NextFunction): Promise<void> {
  // limit expects an upper limit for the date provided - this can be to millisecond amount
  // this should be an ISO formatted string that can be parsed by ZonedDateTime
  const { date, state, limit } = req.query

  try {
    const baseDate = moment(date)

    const toDate = limit && limit.length ?
      limit :
      baseDate.utc().endOf('day').format()

    const result = await Ledger.paymentVolumesAggregate(
      baseDate.utc().startOf('day').format(),
      toDate,
      state
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function ticker(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { from, to} = req.query

  try {
    const result = await Ledger.eventTicker(from, to)
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}

export async function services(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const services = await AdminUsers.services()

    const index = services.reduce((aggregate: any, service: any) => {
      const mapped = {
        ...aggregate,
        ...service.gateway_account_ids.reduce((aggregate: any, account: any) => {
          aggregate[account] = service.service_name.en
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
