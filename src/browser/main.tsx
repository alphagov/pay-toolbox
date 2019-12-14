/* global ResizeObserver */
import React from 'react'
// import { hydrate } from 'react-dom'
import { render } from 'react-dom'

import ResizeObserver from '@juggle/resize-observer'

class EventCard extends React.Component {
  render() {
    return (
      <div className="dashboard-card govuk-!-margin-bottom-2">
        <p className="govuk-body">govuk-grid-column-one-half dashboard-card</p>
      </div>
    )
  }
}

interface StatsPanelProps {
  watch: CallableFunction
}

class StatsPanel extends React.Component<StatsPanelProps, {}> {
  constructor(props: StatsPanelProps) {
    super(props)
    this.setPanelRef = this.setPanelRef.bind(this)
  }
  setPanelRef(element: Element) {
    this.props.watch(element)
  }
  render() {
    return (
      <div ref={this.setPanelRef} className="dashboard-card">
        <span className="govuk-caption-xl">Payments</span>
        <h1 className="govuk-heading-xl">32,450</h1>
        <span className="govuk-caption-xl">Gross volume</span>
        <h1 className="govuk-heading-xl">£506,000</h1>

        <table className="stats-table">

          <tbody className="govuk-table__body">
            <tr className="govuk-table__row">
              <th scope="row" className="stats-cell">
                <span className="govuk-caption-m">All payments</span>
              </th>
              <td className="stats-cell">43,450</td>
            </tr>
            <tr className="govuk-table__row">
              <th scope="row" className="stats-cell">
                <span className="govuk-caption-m">All payments gross volume</span>
              </th>
              <td className="stats-cell">£750,000</td>
            </tr>
            <tr className="govuk-table__row">
              <th scope="row" className="stats-cell">
                <span className="govuk-caption-m">Completion rate</span>
              </th>
              <td className="stats-cell">83%</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
}

interface DashboardState {
  statsHeight: number
}

class Dashboard extends React.Component<{}, DashboardState> {
  constructor(props: {}) {
    super(props)
    this.state = {
      statsHeight: 0
    }
    this.setWatchObserver = this.setWatchObserver.bind(this)
  }

  setWatchObserver(element: Element) {
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0]
      this.setState({
        statsHeight: entry.contentRect.height + 30
      })
    })

    resizeObserver.observe(element)
  }

  render() {
    return (
      <div>
        <div className="govuk-grid-row govuk-body govuk-!-margin-bottom-4">
          <div style={{ maxHeight: this.state.statsHeight, overflow: 'scroll' }} className="govuk-grid-column-one-half">
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          <EventCard />
          </div>
          <div className="govuk-grid-column-one-half">
            <StatsPanel watch={this.setWatchObserver} />
          </div>
        </div>
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-full">
            <div className="dashboard-card">
              <span className="govuk-caption-xl">Friday 13th December 2019</span>
              <p className="govuk-body">Daily graph of payment volume, compared with last week</p>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

class App extends React.Component {
  render() {
    return (
      <div>
        <Dashboard />
      </div>
    )
  }
}

const element = document.getElementById('root')
// hydrate(app, element)
render(<App />, element)
