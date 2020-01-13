import React from 'react'

// import { hydrate } from 'react-dom'
import { render } from 'react-dom'

import { Dashboard } from './dashboard/Dashboard'

class App extends React.Component {
  render() {
    return (
      <div>
        <Dashboard tickInterval={5} />
      </div>
    )
  }
}

const element = document.getElementById('root')
// hydrate(app, element)
render(<App />, element)