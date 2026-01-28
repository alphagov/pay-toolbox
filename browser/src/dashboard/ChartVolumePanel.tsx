import React from 'react'
import { Series } from './Serie'

import moment from 'moment'

import { VolumesByHourChart } from './Chart'

interface ChartVolumePanelProps {
  compareGraphs: boolean
  date: moment.Moment
  compareDate: moment.Moment
  data: Series[]
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