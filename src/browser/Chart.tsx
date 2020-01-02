import React from 'react'
import { ResponsiveLine, Serie } from '@nivo/line'
import { ResponsiveStream } from '@nivo/stream'

const theme = {
  background: "#FFFFFF",
  fontFamily: 'inherit',
  axis: {
    ticks: {},
    legend: {}
  },
  grid: {}
}

interface TestChartProps {
  data: Serie[]
}

export const TestChart = (props: TestChartProps) => <ResponsiveLine
  animate={false}
  isInteractive={false}
  data={props.data}
  xScale={{ type: 'time', format: '%Y-%m-%dT%H:%M:%S.000000Z', precision: 'hour' }}
  xFormat='time:%Y-%m-%dT%H:%M:%S.000000Z'
  margin={{ top: 10, right: 30, bottom: 30, left: 30 }}
  yScale={{
    type: 'linear',
    stacked: false
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
  lineWidth={2}
/>