import React from 'react'
// import { hydrate } from 'react-dom'
import { render } from 'react-dom'

interface DashboardState {
  count: number
}

class Dashboard extends React.Component<{}, DashboardState> {
  interval: NodeJS.Timeout
  constructor(props: {}) {
    super(props)
    this.state = {
      count: 0
    }

    this.interval = setInterval(() => this.tick(), 10)
  }
  tick() {
    this.setState({
      count: this.state.count + 1
    })
  }
  render() {
    return (
      <div>
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-one-half">
            <p className="govuk-body">govuk-grid-column-one-half {this.state.count}</p>
          </div>
          <div className="govuk-grid-column-one-half">
          <p className="govuk-body">govuk-grid-column-one-half {this.state.count}</p>
          </div>
        </div>
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-full">
            <p className="govuk-body">govuk-grid-column-full {this.state.count}</p>
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
