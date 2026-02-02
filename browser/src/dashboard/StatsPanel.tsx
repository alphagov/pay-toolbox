
import React from 'react'

import { DailyVolumeReport } from './ledgerResource'

import { numberFormatter, currencyFormatter } from './format'
import { ValueSpring } from './Spring'

interface StatsPanelProps {
  watch: CallableFunction,
  completed: DailyVolumeReport,
  all: DailyVolumeReport
}

/* eslint-disable @typescript-eslint/no-empty-object-type */
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
        <span className="govuk-caption-xl">Completed payments today</span>
        <h1 className="govuk-heading-xl">
          <ValueSpring
            value={this.props.completed.total_volume}
            formatter={numberFormatter}
          />
        </h1>
        <span className="govuk-caption-xl">Value of completed payments today</span>
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
                <span className="govuk-caption-m">All payments today</span>
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
                <span className="govuk-caption-m">Value of all payments today</span>
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
                <span className="govuk-caption-m">Percentage of completed payments today</span>
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