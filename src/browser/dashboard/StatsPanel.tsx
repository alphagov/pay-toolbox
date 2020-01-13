
import React from 'react'

import { DailyVolumeReport } from './Dashboard'

import { numberFormatter, currencyFormatter } from './format'
import { ValueSpring } from './Spring'

interface StatsPanelProps {
  watch: CallableFunction,
  completed: DailyVolumeReport,
  all: DailyVolumeReport
}

export class StatsPanel extends React.Component<StatsPanelProps, {}> {
  constructor(props: StatsPanelProps) {
    super(props)
    this.setPanelRef = this.setPanelRef.bind(this)
  }
  setPanelRef(element: Element) {
    this.props.watch(element)
  }
  render() {
    const completionRate = this.props.all.total_volume ? (this.props.completed.total_volume / this.props.all.total_volume) * 100 : 0
    return (
      <div ref={this.setPanelRef} className="dashboard-card">
        <span className="govuk-caption-xl">Payments</span>
        <h1 className="govuk-heading-xl">
          <ValueSpring
            value={this.props.completed.total_volume}
            formatter={numberFormatter}
          />
        </h1>
        <span className="govuk-caption-xl">Gross volume</span>
        <h1 className="govuk-heading-xl">
          <ValueSpring
            value={this.props.completed.total_amount / 100}
            formatter={currencyFormatter}
          />
        </h1>

        <table className="stats-table">

          <tbody className="govuk-table__body">
            <tr className="govuk-table__row">
              <th scope="row" className="stats-cell">
                <span className="govuk-caption-m">All payments</span>
              </th>
              <td className="stats-cell" style={{ minWidth: 130 }}>
                <ValueSpring
                  value={this.props.all.total_volume}
                  formatter={numberFormatter}
                />
              </td>
            </tr>
            <tr className="govuk-table__row">
              <th scope="row" className="stats-cell">
                <span className="govuk-caption-m">All payments gross volume</span>
              </th>
              <td className="stats-cell" style={{ minWidth: 130 }}>
                <ValueSpring
                  value={this.props.all.total_amount / 100}
                  formatter={currencyFormatter}
                />
              </td>
            </tr>
            <tr className="govuk-table__row">
              <th scope="row" className="stats-cell">
                <span className="govuk-caption-m">Completion rate</span>
              </th>
              <td className="stats-cell" style={{ minWidth: 130 }}>
                <ValueSpring
                  value={completionRate}
                  formatter={numberFormatter}
                />
                %
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
}