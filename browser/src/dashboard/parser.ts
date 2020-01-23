import moment from 'moment'
import { Serie } from '@nivo/line'

export interface TimeseriesPoint {
  timestamp: string
  all_payments: number
  errored_payments: number
  completed_payments: number
  amount: number
  net_amount: number
  total_amount: number
  fee: number
}

// assuming we're always only dealing with one day
const padTimes = function padTimes(timeseries: TimeseriesPoint[], baseDate: moment.Moment, padFuture: boolean = false) {
  const ordered: TimeseriesPoint[] = []

  const index = timeseries.reduce((aggregate: any, point) => {
    const date = moment(point.timestamp)
    aggregate[date.hour()] = point
    return aggregate
  }, {})

  const processingHour = moment().hour()

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

      // only pad with empty if we want to pad the future (comparison in the past vs. live now)
      // @TODO(sfount) configuration option for padding everything (Stripe pads everything)
      if (i <= processingHour || padFuture) {
        ordered.push(emptyset)
      }
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

export function jsonToChartData(
  reportResult: TimeseriesPoint[],
  baseDate: moment.Moment,
  compareReportResult: TimeseriesPoint[] = [],
  includeComparison: boolean = false,
  comparisonDate: moment.Moment
): Serie[] {
  const padded = padTimes(reportResult, baseDate)
  const comparePadded = padTimes(compareReportResult, baseDate, true)

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
      'id': 'All payments',
      'data': timedata(padded, 'all_payments'),
      'color': '#1d70b8'
    }
  ]

  if (includeComparison) {
    series.push({
      'id': comparisonDate ? comparisonDate.format('dddd Do MMMM YYYY') : 'Comparison payments',
      'data': timedata(comparePadded, 'completed_payments'),
      'color': '#b1b4b64d'
    })
  }

  return series

}