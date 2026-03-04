import React from 'react'

// import { hydrate } from 'react-dom'
import { render } from 'react-dom'

class App extends React.Component {
  render() {
    return (
      <div>
      </div>
    )
  }
}

const element = document.getElementById('root')
// hydrate(app, element)
render(<App />, element)
