import React from 'react'

import moment from 'moment'

import { VolumesByHourChart } from './Chart'

import { ComponentProps } from 'react';
import { ResponsiveLine } from '@nivo/line';

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };
export type Serie = DeepWriteable<NonNullable<ComponentProps<typeof ResponsiveLine>['data']>[number]>;

interface ChartVolumePanelProps {
  compareGraphs: boolean
  date: moment.Moment
  compareDate: moment.Moment
  data: Serie[]
}

export class ChartVolumePanel extends React.Component<ChartVolumePanelProps, {}> {

  render() {
    return (
      <div className="dashboard-card">
        <div className="govuk-body" style={{ height: 320 }}>
          <VolumesByHourChart data={this.props.data} />
        </div>
      </div>
    )
  }

}