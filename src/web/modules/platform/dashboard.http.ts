import { Request, Response, NextFunction } from 'express'

import moment from 'moment'
import { Ledger, AdminUsers } from './../../../lib/pay-request'

export function dashboard(req: Request, res: Response): void {
  res.render('platform/dashboard')
}

export function live(req: Request, res: Response): void {
  res.render('platform/live')
}

// API
export async function timeseries(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { date } = req.query

  try {
    const baseDate = moment(date)

    const result = await Ledger.paymentVolumesByHour(
      baseDate.utc().startOf('day').format(),
      baseDate.utc().endOf('day').format()
    )
    res.status(200).json(result)
  } catch (error) {
    next(error)
  }
}


// @FIXME(sfount) support state flag to differentiate all vs. successful
export async function aggregate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { date, state } = req.query

  try {
    const baseDate = moment(date)

    const result = await Ledger.paymentVolumesAggregate(
      baseDate.utc().startOf('day').format(),
      baseDate.utc().endOf('day').format(),
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
