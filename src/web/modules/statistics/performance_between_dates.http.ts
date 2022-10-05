import { Request, Response } from 'express'
import moment from 'moment'
import { Ledger } from '../../../lib/pay-request'
import BetweenDatesFilter from "./betweenDatesFilter.model";

function convertToUnits(value: number) {
  let stringOfAmount

  if (value >= 1000000 && value < 1000000000) {
    stringOfAmount = (value / 1.0e6).toFixed(1) + " million";
  } else if (value >= 10000000) {
    stringOfAmount = (value / 1.0e9).toFixed(1) + " billion";
  } else {
    stringOfAmount = value.toString()
  }

  return stringOfAmount;
}

export async function overview(req: Request, res: Response) {
  res.render('statistics/betweenDatesPage')
}

export async function downloadData(req: Request, res: Response) {
  const { fromDate, toDate } = new BetweenDatesFilter(req.body)

  const paymentStatistics = await Ledger.paymentVolumesAggregate(fromDate, toDate, 'SUCCESS')

  const data = {
    dateUpdated: moment().format('D MMMM YYYY'),
    numberOfPayments: convertToUnits(paymentStatistics.total_volume),
    totalPaymentAmount: convertToUnits(paymentStatistics.total_amount / 100)
  }

  res.set('Content-Type', 'application/json')
  res.set('Content-Disposition', `attachment; filename="performance-between-dates.json"`)
  res.status(200).send(JSON.stringify(data, null, 2))
}
