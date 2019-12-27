import React from 'react'
import { ResponsiveLine } from '@nivo/line'
import { ResponsiveStream } from '@nivo/stream'

export const TestChart = () => <ResponsiveLine
  animate={false}
  // data={[
  //   {
  //     id: 'fake lines',
  //     data: [
  //       { x: '2018-01-01', y: 7 },
  //       { x: '2018-01-02', y: 5 },
  //       { x: '2018-01-03', y: 11 },
  //       { x: '2018-01-04', y: 9 },
  //       { x: '2018-01-05', y: 12 },
  //       { x: '2018-01-06', y: 16 },
  //       { x: '2018-01-07', y: 13 },
  //       { x: '2018-01-08', y: 13 }
  //     ]
  //   }
  // ]}
  data={timeseries}
  xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%S+00:00', precision: 'hour' }}
  xFormat='time:%Y-%m-%dT%H:%M:%S+00:00'
  margin={{ top: 10, right: 30, bottom: 10, left: 30 }}
  yScale={{
    type: 'linear'
  }}
  colors={d => d.color}
  axisLeft={{ legend: 'linear scale', legendOffset: 12 }}
  axisBottom={{ format: '%b %d', tickValues: 'every 2 days', legend: 'time scale', legendOffset: -12 }}
  // curve={}
  enablePointLabel={false}
  enablePoints={false}
  useMesh={true}
  enableSlices={false}
  enableArea={true}
  areaBlendMode='multiply'
/>

export const DailyVolumeChart = () => <ResponsiveLine
    animate={false}
    isInteractive={true}
    data={timeseries}
    margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
    xScale={{
      type: 'time',
      format: '%Y-%m-%d',
      precision: 'day'
    }}
    xFormat="time:%Y-%m-%d"
    yScale={{ type: 'linear', stacked: true, min: 'auto', max: 'auto' }}
    axisTop={null}
    axisRight={null}
    axisBottom={{
        orient: 'bottom',
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'transportation',
        legendOffset: 36,
        legendPosition: 'middle'
    }}
    axisLeft={{
        orient: 'left',
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'count',
        legendOffset: -40,
        legendPosition: 'middle'
    }}
    colors={{ scheme: 'nivo' }}
    pointSize={10}
    pointColor={{ theme: 'background' }}
    pointBorderWidth={2}
    pointBorderColor={{ from: 'serieColor' }}
    pointLabel="y"
    pointLabelYOffset={-12}
    useMesh={true}
    legends={[
        {
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: 'left-to-right',
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: 'circle',
            symbolBorderColor: 'rgba(0, 0, 0, .5)',
            effects: [
                {
                    on: 'hover',
                    style: {
                        itemBackground: 'rgba(0, 0, 0, .03)',
                        itemOpacity: 1
                    }
                }
            ]
        }
    ]}
/>

const int = [{"timestamp":"2019-11-20T09:00:00+00:00","payments":1,"errored_payments":0,"completed_payments":0,"amount":100,"net_amount":null,"total_amount":null,"fee":null},
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

const hours = []

// for (let i = 0; i < 24; i++) {
//   hours.push({

//   })
// }

const timedata = (key:string) => int.map((entry) => {
  return {
    x: entry.timestamp,
    //@ts-ignorets-ignore
    y: entry[key] || 0
  }
})

const timeseries = [
  {
    'id': 'Total payments',
    'data': timedata('payments'),
    'color': '#1d70b8'
  },
  {
    'id': 'Errored payments',
    'data': timedata('errored_payments'),
    'color': '#d4351c'
  },
  {
    'id': 'Completed payments',
    'data': timedata('completed_payments'),
    'color': '#00703c'
  }
]

const data = [
  {
    "id": "japan",
    "color": "hsl(111, 70%, 50%)",
    "data": [
      {
        "x": "plane",
        "y": 187
      },
      {
        "x": "helicopter",
        "y": 170
      },
      {
        "x": "boat",
        "y": 102
      },
      {
        "x": "train",
        "y": 171
      },
      {
        "x": "subway",
        "y": 264
      },
      {
        "x": "bus",
        "y": 72
      },
      {
        "x": "car",
        "y": 155
      },
      {
        "x": "moto",
        "y": 203
      },
      {
        "x": "bicycle",
        "y": 2
      },
      {
        "x": "horse",
        "y": 279
      },
      {
        "x": "skateboard",
        "y": 48
      },
      {
        "x": "others",
        "y": 286
      }
    ]
  },
  {
    "id": "france",
    "color": "hsl(283, 70%, 50%)",
    "data": [
      {
        "x": "plane",
        "y": 281
      },
      {
        "x": "helicopter",
        "y": 292
      },
      {
        "x": "boat",
        "y": 187
      },
      {
        "x": "train",
        "y": 135
      },
      {
        "x": "subway",
        "y": 104
      },
      {
        "x": "bus",
        "y": 177
      },
      {
        "x": "car",
        "y": 194
      },
      {
        "x": "moto",
        "y": 268
      },
      {
        "x": "bicycle",
        "y": 104
      },
      {
        "x": "horse",
        "y": 129
      },
      {
        "x": "skateboard",
        "y": 74
      },
      {
        "x": "others",
        "y": 218
      }
    ]
  },
  {
    "id": "us",
    "color": "hsl(278, 70%, 50%)",
    "data": [
      {
        "x": "plane",
        "y": 8
      },
      {
        "x": "helicopter",
        "y": 252
      },
      {
        "x": "boat",
        "y": 230
      },
      {
        "x": "train",
        "y": 172
      },
      {
        "x": "subway",
        "y": 270
      },
      {
        "x": "bus",
        "y": 227
      },
      {
        "x": "car",
        "y": 192
      },
      {
        "x": "moto",
        "y": 50
      },
      {
        "x": "bicycle",
        "y": 231
      },
      {
        "x": "horse",
        "y": 164
      },
      {
        "x": "skateboard",
        "y": 260
      },
      {
        "x": "others",
        "y": 293
      }
    ]
  },
  {
    "id": "germany",
    "color": "hsl(342, 70%, 50%)",
    "data": [
      {
        "x": "plane",
        "y": 2
      },
      {
        "x": "helicopter",
        "y": 287
      },
      {
        "x": "boat",
        "y": 163
      },
      {
        "x": "train",
        "y": 60
      },
      {
        "x": "subway",
        "y": 143
      },
      {
        "x": "bus",
        "y": 3
      },
      {
        "x": "car",
        "y": 39
      },
      {
        "x": "moto",
        "y": 259
      },
      {
        "x": "bicycle",
        "y": 126
      },
      {
        "x": "horse",
        "y": 181
      },
      {
        "x": "skateboard",
        "y": 21
      },
      {
        "x": "others",
        "y": 242
      }
    ]
  },
  {
    "id": "norway",
    "color": "hsl(138, 70%, 50%)",
    "data": [
      {
        "x": "plane",
        "y": 165
      },
      {
        "x": "helicopter",
        "y": 8
      },
      {
        "x": "boat",
        "y": 53
      },
      {
        "x": "train",
        "y": 7
      },
      {
        "x": "subway",
        "y": 165
      },
      {
        "x": "bus",
        "y": 7
      },
      {
        "x": "car",
        "y": 88
      },
      {
        "x": "moto",
        "y": 48
      },
      {
        "x": "bicycle",
        "y": 25
      },
      {
        "x": "horse",
        "y": 49
      },
      {
        "x": "skateboard",
        "y": 54
      },
      {
        "x": "others",
        "y": 208
      }
    ]
  }
]