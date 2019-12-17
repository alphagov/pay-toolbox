/* global ResizeObserver */
import React, { ReactComponentElement, ReactSVG } from 'react'
// import { hydrate } from 'react-dom'
import { render } from 'react-dom'

import ResizeObserver from '@juggle/resize-observer'
import { BackgroundColorProperty, ColorProperty } from 'csstype'

import VisaIcon from './assets/card_visa.svg'
import MastercardIcon from './assets/card_mastercard.svg'
import AmexIcon from './assets/card_amex.svg'
import UnknownIcon from './assets/card_unknown.svg'

import WorldpayLogo from './assets/psp_worldpay.jpg'
import StripeLogo from './assets/psp_stripe.jpg'
import BarclaysLogo from './assets/psp_barclays.jpg'

import StatusFailureIcon from './assets/status_failure.svg'
import StatusSuccessIcon from './assets/status_success.svg'

import SVG from 'react-inlinesvg'

interface CardProfile {
  backgroundColour: BackgroundColorProperty
  colour: ColorProperty
}

const SuccessProfile: CardProfile = {
  backgroundColour: '#00703c',
  colour: '#ffffff'
}

const FailureProfile: CardProfile = {
  backgroundColour: '#d4351c',
  colour: '#ffffff'
}

// @TODO(sfount) question if standard cards should be dark grey or white
const DefaultProfile: CardProfile = {
  backgroundColour: '#ffffff',
  colour: '#000000'
}

interface EventCardProps {
  profile: CardProfile,
  TMPicon: string
}

interface CardIconProps {
  icon: string
}
const CardIcon = (props: CardIconProps) => (
  <div style={{ marginRight: 5 }}>
    <SVG src={props.icon} width={50} height={50} />
  </div>
)

interface CardImageProps {
  image: string
}
const CardImage = (props: CardImageProps) => (
  <div style={{ marginRight: 10, paddingBottom: 5 }}>
    <img src={props.image}style={{ width: 35, height: 35, display: 'block', borderRadius: 3 }} />
  </div>
)


class EventCard extends React.Component<EventCardProps, {}> {
  render() {
    return (
      <div className="event-card govuk-!-margin-bottom-2" style={{ backgroundColor: this.props.profile.backgroundColour }}>
        <div style={{ textAlign: 'right', width: '100%' }}>
          <span className="govuk-body-s" style={{ color: this.props.profile.colour, opacity: 0.7 }}>Send money to prisoners</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <CardIcon icon={this.props.TMPicon} />
          {/* <CardImage image={WorldpayLogo} /> */}
          <div>
          <span className="govuk-body-l" style={{ color: this.props.profile.colour }}><strong>£45.00</strong></span>
          </div>
        </div>
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
          {/* @TODO(sfount) bottom shadow (without factoring in column padding) is needed for parity */}
          <div style={{ maxHeight: this.state.statsHeight, overflowY: 'scroll' }} className="govuk-grid-column-one-half">
          <EventCard profile={SuccessProfile} TMPicon={StatusSuccessIcon} />
          <EventCard profile={FailureProfile} TMPicon={StatusFailureIcon} />
          <EventCard profile={DefaultProfile} TMPicon={UnknownIcon} />
          <EventCard profile={DefaultProfile} TMPicon={MastercardIcon} />
          <EventCard profile={DefaultProfile} TMPicon={AmexIcon} />
          <EventCard profile={DefaultProfile} TMPicon={VisaIcon} />
          <EventCard profile={DefaultProfile} TMPicon={VisaIcon} />
          <EventCard profile={DefaultProfile} TMPicon={VisaIcon} />
          <EventCard profile={DefaultProfile} TMPicon={VisaIcon} />
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
