/* global ResizeObserver */
import React from 'react'

// import { hydrate } from 'react-dom'
import { render } from 'react-dom'

import ResizeObserver from '@juggle/resize-observer'
import { BackgroundColorProperty, ColorProperty } from 'csstype'

import { TestChart } from './Chart'
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

import { Event } from 'ledger'

import moment from 'moment'
import { Serie } from '@nivo/line'

import { json } from './VolumeByHour/parser'

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
  // profile: CardProfile,
  // TMPicon: string
  event: Event
}

interface CardIconProps {
  icon: string
}
const CardIcon = (props: CardIconProps) => (
  <div style={{ marginRight: 5 }}>
    <SVG src={props.icon} width={35} height={35} />
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
    const profileMap: { [key: string]: CardProfile } = {
      'PAYMENT_DETAILS_ENTERED': DefaultProfile,
      'GATEWAY_ERROR_DURING_AUTHORISATION': FailureProfile,
      'AUTHORISATION_SUCCEEDED': SuccessProfile,
      'PAYMENT_CREATED': DefaultProfile
    }

    const paymentTypeMap: { [key: string]: string } = {
      'visa': VisaIcon,
      'mastercard': MastercardIcon,
      'amex': AmexIcon
    }

    const providerLogoMap: { [key: string]: string } = {
      'worldpay': WorldpayLogo,
      'stripe': StripeLogo,
      'epdq': BarclaysLogo,
      'smartpay': BarclaysLogo
    }

    const profile = profileMap[this.props.event.event_type]
    const paymentTypeIcon = paymentTypeMap[this.props.event.card_brand] || UnknownIcon
    const paymentProviderIcon = providerLogoMap[this.props.event.payment_provider]

    let icon: JSX.Element

    switch (this.props.event.event_type) {
      case 'PAYMENT_DETAILS_ENTERED':
        icon = <CardIcon icon={paymentTypeIcon} />
        break
      case 'GATEWAY_ERROR_DURING_AUTHORISATION':
        icon = <CardIcon icon={StatusFailureIcon} />
        break
      case 'AUTHORISATION_SUCCEEDED':
        icon = <CardIcon icon={StatusSuccessIcon} />
        break
      case 'PAYMENT_CREATED':
        icon = <CardImage image={paymentProviderIcon} />
      break
    }

    return (
      <div className="event-card govuk-!-margin-bottom-2" style={{ backgroundColor: profile.backgroundColour }}>
        <div style={{ textAlign: 'right', width: '100%' }}>
          <span className="govuk-body-s" style={{ color: profile.colour, opacity: 0.7 }}>Send money to prisoners</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {icon}
          <div>
          <span className="govuk-body-l" style={{ color: profile.colour }}><strong>£45.00</strong></span>
          </div>
        </div>
      </div>
    )
  }
}

interface StatsPanelProps {
  watch: CallableFunction,
  completed: DailyVolumeReport,
  all: DailyVolumeReport
}

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP'
})

const numberFormatter = new Intl.NumberFormat('en-GB')

class StatsPanel extends React.Component<StatsPanelProps, {}> {
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
          {numberFormatter.format(this.props.completed.total_volume)}
        </h1>
        <span className="govuk-caption-xl">Gross volume</span>
        <h1 className="govuk-heading-xl">
          {currencyFormatter.format(this.props.completed.total_amount / 100)}
        </h1>

        <table className="stats-table">

          <tbody className="govuk-table__body">
            <tr className="govuk-table__row">
              <th scope="row" className="stats-cell">
                <span className="govuk-caption-m">All payments</span>
              </th>
              <td className="stats-cell">{numberFormatter.format(this.props.all.total_volume)}</td>
            </tr>
            <tr className="govuk-table__row">
              <th scope="row" className="stats-cell">
                <span className="govuk-caption-m">All payments gross volume</span>
              </th>
              <td className="stats-cell">{currencyFormatter.format(this.props.all.total_amount / 100)}</td>
            </tr>
            <tr className="govuk-table__row">
              <th scope="row" className="stats-cell">
                <span className="govuk-caption-m">Completion rate</span>
              </th>
              <td className="stats-cell">{completionRate}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
}

interface DailyVolumeReport {
  total_volume: number,
  total_amount: number,
  average_amount: number
}

interface DashboardState {
  statsHeight: number,
  events: Event[],
  date: moment.Moment,
  compareDate: moment.Moment,
  compareGraphs: boolean,
  transactionVolumesByHour: Serie[],
  aggregateCompletedVolumes: DailyVolumeReport,
  aggregateAllVolumes: DailyVolumeReport
}

class Dashboard extends React.Component<{}, DashboardState> {
  constructor(props: {}) {
    super(props)

    const now = moment()

    const zeroed: DailyVolumeReport ={
      total_amount: 0,
      total_volume: 0,
      average_amount: 0
    }

    this.state = {
      statsHeight: 0,
      events: [],
      date: now,
      compareDate: moment(now).subtract(14, 'days'),
      compareGraphs: true,
      // better for animation
      // transactionVolumesByHour: json([], now)
      // better without animation
      transactionVolumesByHour: [],
      aggregateAllVolumes: zeroed,
      aggregateCompletedVolumes: zeroed
    }
    this.setWatchObserver = this.setWatchObserver.bind(this)

    this.fetchTransactionVolumesByHour()
    this.fetchAggregateVolumes()
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

  async fetchTransactionVolumesByHour() {
    const response = await fetch(
      `/api/platform/timeseries?date=${this.state.date.utc().format()}`
    )
    const data = await response.json()

    let compareData = []
    if (this.state.compareGraphs) {
      const compareResponse = await fetch(
        `/api/platform/timeseries?date=${this.state.compareDate.utc().format()}`
      )
      compareData = await compareResponse.json()
    }

    this.setState({
      transactionVolumesByHour: json(data, this.state.date, compareData, this.state.compareGraphs)

    })
  }

  async fetchAggregateVolumes() {
    const completedResponse = await fetch(
      `/api/platform/aggregate?date=${this.state.date.utc().format()}`
    )
    const completedData = await completedResponse.json()

    // @FIXME(sfount) do these at the same time
    // @FIXME(sfount) add the state flag to this query
    const allResponse = await fetch(
      `/api/platform/aggregate?date=${this.state.date.utc().format()}`
    )
    const allData = await allResponse.json()

    this.setState({
      aggregateCompletedVolumes: completedData,
      aggregateAllVolumes: allData
    })
  }

  render() {
    // @TODO(sfount) prop key should be the events id (which will actually come from the ledger resource)
    const events = this.state.events.map((event, index) => {
      return (
        <EventCard key={index} event={event} />
      )
    })
    const compareGraphString = this.state.compareGraphs ?
      ` (${this.state.compareDate.format('dddd Do MMMM YYYY')})` :
      ''
    return (
      <div>
        <div className="govuk-grid-row govuk-body govuk-!-margin-bottom-4">
          {/* @TODO(sfount) bottom shadow (without factoring in column padding) is needed for parity */}
          {/* Non-zero min-height to maintain width without content (a loading or syncing icon should be used) */}
          <div style={{ maxHeight: this.state.statsHeight, overflowY: 'scroll', minHeight: 5 }} className="govuk-grid-column-one-half">
            {events}
          </div>
          <div className="govuk-grid-column-one-half">
            <StatsPanel
              completed={this.state.aggregateCompletedVolumes}
              all={this.state.aggregateAllVolumes}
              watch={this.setWatchObserver}
            />
          </div>
        </div>
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-full">
            <div className="dashboard-card">
              <span className="govuk-caption-xl">
                {this.state.date.format('dddd Do MMMM YYYY')}
                <i>{compareGraphString}</i>
              </span>
              <div className="govuk-body" style={{ height: 280 }}>
                {/* <DailyVolumeChart /> */}
                <TestChart data={this.state.transactionVolumesByHour} />
              </div>
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

  // const completedEvent: Event = {
  //   gateway_account_id: '136',
  //   service_name: 'Send money to prisoners',
  //   event_type: 'AUTHORISATION_SUCCEEDED',
  //   type: 'PAYMENT',
  //   amount: 4500,
  //   resource_external_id: 'someid',
  //   event_date: '2019-08-08',
  //   payment_provider: 'stripe'
  // }

  // const failedEvent: Event = {
  //   event_type: 'GATEWAY_ERROR_DURING_AUTHORISATION',
  //   type: 'PAYMENT',
  //   gateway_account_id: '136',
  //   service_name: 'Send money to prisoners',
  //   amount: 4500,
  //   resource_external_id: 'someid',
  //   event_date: '2019-08-08',
  //   payment_provider: 'stripe'
  // }

  // const detailsEnteredEventVisa: Event = {
  //   event_type: 'PAYMENT_DETAILS_ENTERED',
  //   type: 'PAYMENT',
  //   gateway_account_id: '136',
  //   service_name: 'Send money to prisoners',
  //   amount: 4500,
  //   resource_external_id: 'someid',
  //   event_date: '2019-08-08',
  //   payment_provider: 'stripe',
  //   card_brand: 'visa'
  // }

  // const detailsEnteredEventMastercard: Event = {
  //   event_type: 'PAYMENT_DETAILS_ENTERED',
  //   type: 'PAYMENT',
  //   gateway_account_id: '136',
  //   service_name: 'Send money to prisoners',
  //   amount: 4500,
  //   resource_external_id: 'someid',
  //   event_date: '2019-08-08',
  //   payment_provider: 'stripe',
  //   card_brand: 'mastercard'
  // }

  // const createdEventStripe: Event = {
  //   gateway_account_id: '136',
  //   service_name: 'Send money to prisoners',
  //   event_type: 'PAYMENT_CREATED',
  //   type: 'PAYMENT',
  //   payment_provider: 'stripe',
  //   amount: 4500,
  //   resource_external_id: 'someid',
  //   event_date: '2019-08-08'
  // }

  // const createdEventWorldpay: Event = {
  //   gateway_account_id: '136',
  //   service_name: 'Send money to prisoners',
  //   event_type: 'PAYMENT_CREATED',
  //   type: 'PAYMENT',
  //   payment_provider: 'worldpay',
  //   amount: 4500,
  //   resource_external_id: 'someid',
  //   event_date: '2019-08-08'

  // }