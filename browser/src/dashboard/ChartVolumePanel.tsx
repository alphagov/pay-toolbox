import React, { Props } from 'react'

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
    const compareGraphString = this.props.compareGraphs ?
      ` (${this.props.compareDate.format('dddd Do MMMM YYYY')})` :
      ''

    return (
      <div className="dashboard-card">
        <span className="govuk-caption-xl">
          {this.props.date.format('dddd Do MMMM YYYY')}
        </span>
        <div className="govuk-body" style={{ height: 320 }}>
          <VolumesByHourChart data={this.props.data} />
        </div>
      </div>
    )
  }

}