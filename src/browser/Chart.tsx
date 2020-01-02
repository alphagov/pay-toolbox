import React from 'react'
import { ResponsiveLine } from '@nivo/line'
import { ResponsiveStream } from '@nivo/stream'

import moment from 'moment'

const theme = {
  background: "#FFFFFF",
  fontFamily: 'inherit',
  axis: {
    ticks: {},
    legend: {}
  },
  grid: {}
}

export const TestChart = () => <ResponsiveLine
  animate={false}
  isInteractive={false}
  data={timeseries}
  xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%S%Z', precision: 'hour' }}
  xFormat='time:%Y-%m-%dT%H:%M:%S%Z'
  margin={{ top: 10, right: 30, bottom: 30, left: 30 }}
  yScale={{
    type: 'linear'
  }}
  theme={theme}
  colors={d => d.color}
  // axisLeft={{ legend: 'linear scale', legendOffset: 12 }}
  axisBottom={{ format: '%H:%M', tickValues: 'every 2 hours' }}
  // curve={}
  enablePointLabel={false}
  enablePoints={false}
  useMesh={true}
  enableSlices={false}
  enableArea={true}
  enableGridX={true}
  enableGridY={false}
  areaOpacity={0.7}
/>

interface TimeseriesPoint {
  "timestamp": string;
  "payments": number;
  "errored_payments": number;
  "completed_payments": number;
  "amount": number;
  "net_amount": number;
  "total_amount": number;
  "fee": number;
}

const int: TimeseriesPoint[] = [{"timestamp":"2019-11-20T09:00:00+00:00","payments":1,"errored_payments":0,"completed_payments":0,"amount":100,"net_amount":null,"total_amount":null,"fee":null},
{"timestamp":"2019-11-20T10:00:00+00:00","payments":12,"errored_payments":0,"completed_payments":7,"amount":6800300,"net_amount":97000,"total_amount":700000,"fee":3000},
{"timestamp":"2019-11-20T11:00:00+00:00","payments":9,"errored_payments":0,"completed_payments":7,"amount":805050,"net_amount":97000,"total_amount":700000,"fee":3000},
{"timestamp":"2019-11-20T12:00:00+00:00","payments":10,"errored_payments":0,"completed_payments":0,"amount":16040000,"net_amount":null,"total_amount":null,"fee":null},
{"timestamp":"2019-11-20T13:00:00+00:00","payments":8,"errored_payments":0,"completed_payments":7,"amount":800000,"net_amount":97000,"total_amount":700000,"fee":3000},
{"timestamp":"2019-11-20T14:00:00+00:00","payments":9,"errored_payments":0,"completed_payments":7,"amount":805050,"net_amount":97000,"total_amount":700000,"fee":3000},
{"timestamp":"2019-11-20T15:00:00+00:00","payments":10,"errored_payments":0,"completed_payments":7,"amount":4800000,"net_amount":97000,"total_amount":700000,"fee":3000},
{"timestamp":"2019-11-20T16:00:00+00:00","payments":9,"errored_payments":0,"completed_payments":7,"amount":2800000,"net_amount":97000,"total_amount":700000,"fee":3000},
{"timestamp":"2019-11-20T17:00:00+00:00","payments":1,"errored_payments":0,"completed_payments":0,"amount":5050,"net_amount":null,"total_amount":null,"fee":null},
{"timestamp":"2019-11-20T18:00:00+00:00","payments":6,"errored_payments":0,"completed_payments":2,"amount":12000000,"net_amount":null,"total_amount":6000000,"fee":null},
{"timestamp":"2019-11-20T19:00:00+00:00","payments":1,"errored_payments":0,"completed_payments":0,"amount":2000000,"net_amount":null,"total_amount":null,"fee":null}]

// assuming we're always only dealing with one day
const padTimes = function padTimes(timeseries: TimeseriesPoint[]) {
  const ordered: TimeseriesPoint[] = []
  const sample = timeseries[0]

  const index = timeseries.reduce((aggregate: any, point) => {
    const date = moment(point.timestamp)
    aggregate[date.hour()] = point
    return aggregate
  }, {})

  for(let i = 0; i < 24; i++) {
    if(!index[i]) {
      const date = moment(sample.timestamp)
      date.set('hour', i)
      const emptyset: TimeseriesPoint = {
        timestamp: date.format('YYYY-MM-DDTHH:mm:ssZ'),
        payments: 0,
        errored_payments: 0,
        completed_payments: 0,
        amount: 0,
        net_amount: 0,
        total_amount: 0,
        fee: 0
      }
      ordered.push(emptyset)
    } else {
      ordered.push(index[i])
    }
  }
  return ordered
}

// for (let i = 0; i < 24; i++) {
//   hours.push({

//   })
// }

const timedata = (key:string) => padTimes(int).map((entry) => {
  return {
    x: entry.timestamp,
    //@ts-ignorets-ignore
    y: entry[key] || 0
  }
})

const timeseries = [
  {
    'id': 'Errored payments',
    'data': timedata('errored_payments'),
    'color': '#d4351c'
  },
  {
    'id': 'Completed payments',
    'data': timedata('completed_payments'),
    'color': '#00703c'
  },
  {
    'id': 'Total payments',
    'data': timedata('payments'),
    'color': '#1d70b8'
  }
]