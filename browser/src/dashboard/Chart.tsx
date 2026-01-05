import React from 'react'
import { ResponsiveLine, LineSeries } from '@nivo/line'

const theme = {
  background: "#FFFFFF",
  fontFamily: 'inherit',
  axis: {
    ticks: {},
    legend: {}
  },
  grid: {}
}

interface VolumesByHourChart {
  data: LineSeries[]
}

export const VolumesByHourChart = (props: VolumesByHourChart) => <ResponsiveLine
  animate={true}
  isInteractive={false}
  data={props.data}
  xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%S.000000Z', precision: 'hour' }}
  xFormat='time:%Y-%m-%dT%H:%M:%S.000000Z'
  margin={{ top: 10, right: 30, bottom: 60, left: 38 }}
  yScale={{
    type: 'linear',
    stacked: false,
    min: 0
  }}
  theme={theme}
  colors={d => d.color}
  axisBottom={{ format: '%H:%M', tickValues: 'every 2 hours' }}
  enablePointLabel={false}
  enablePoints={false}
  useMesh={true}
  enableSlices={false}
  enableArea={true}
  enableGridX={true}
  enableGridY={false}
  areaOpacity={0.7}
  lineWidth={2}
  legends={[
    {
      anchor: 'bottom',
      direction: 'row',
      justify: false,
      translateY: 60,
      translateX: 30,
      itemsSpacing: 10,
      itemDirection: 'left-to-right',
      itemWidth: 230,
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