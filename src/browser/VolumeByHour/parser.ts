import moment from 'moment'
import { Serie } from '@nivo/line'

export interface TimeseriesPoint {
  "timestamp": string;
  "all_payments": number;
  "errored_payments": number;
  "completed_payments": number;
  "amount": number;
  "net_amount": number;
  "total_amount": number;
  "fee": number;
}

// assuming we're always only dealing with one day
const padTimes = function padTimes(timeseries: TimeseriesPoint[], baseDate: moment.Moment) {
  const ordered: TimeseriesPoint[] = []

  const index = timeseries.reduce((aggregate: any, point) => {
    const date = moment(point.timestamp)
    aggregate[date.hour()] = point
    return aggregate
  }, {})

  for(let i = 0; i < 24; i++) {
    if(!index[i]) {
      const date = moment(baseDate)
      date.set('hour', i)
      const emptyset: TimeseriesPoint = {
        timestamp: `${date.format('YYYY-MM-DDTHH:mm:ss')}.000000Z`,
        all_payments: 0,
        errored_payments: 0,
        completed_payments: 0,
        amount: 0,
        net_amount: 0,
        total_amount: 0,
        fee: 0
      }
      ordered.push(emptyset)
    } else {
      // override for comparison dates
      const date = moment(baseDate)
      date.set('hour', i)

      index[i].timestamp = `${date.format('YYYY-MM-DDTHH:mm:ss')}.000000Z`
      ordered.push(index[i])
    }
  }
  return ordered
}

function timedata(data: TimeseriesPoint[], key: string) {
  return data.map((entry) => {
    return {
      x: entry.timestamp,
      //@ts-ignorets-ignore
      y: entry[key] || 0
    }
  })
}

export function json(reportResult: TimeseriesPoint[], baseDate: moment.Moment, compareReportResult: TimeseriesPoint[] = [], includeComparison: boolean = false): Serie[] {
  const padded = padTimes(reportResult, baseDate)
  const comparePadded = padTimes(compareReportResult, baseDate)

  const series = [
    {
      'id': 'Errored payments',
      'data': timedata(padded, 'errored_payments'),
      'color': '#d4351c'
    },
    {
      'id': 'Completed payments',
      'data': timedata(padded, 'completed_payments'),
      'color': '#00703c'
    },
    {
      'id': 'Total payments',
      'data': timedata(padded, 'all_payments'),
      'color': '#1d70b8'
    }
  ]

  if (includeComparison) {
    series.push({
      'id': 'Comparison payments',
      'data': timedata(comparePadded, 'all_payments'),
      'color': '#b1b4b6'
    })
  }

  return series

}