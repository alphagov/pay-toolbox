import React from 'react'

import moment from 'moment'

import { VolumesByHourChart } from './Chart'

import { Serie } from '@nivo/line'


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