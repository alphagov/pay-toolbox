/* global ResizeObserver */
import React, { Props } from 'react'

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

import { useSpring, animated, useTransition } from 'react-spring'

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
  <div style={{ marginRight: 10 }}>
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
      'PAYMENT_CREATED': DefaultProfile,
      'PAYMENT_DETAILS_ENTERED': DefaultProfile,
      ...eventsSuccess.reduce((aggregate: any, event) => {
        aggregate[event] = SuccessProfile
        return aggregate
      }, {}),
      ...eventsErrored.reduce((aggregate: any, event) => {
        aggregate[event] = FailureProfile
        return aggregate
      }, {})
    }

    const paymentTypeMap: { [key: string]: string } = {
      'visa': VisaIcon,
      'master-card': MastercardIcon,
      'american-express': AmexIcon
    }

    const providerLogoMap: { [key: string]: string } = {
      'worldpay': WorldpayLogo,
      'stripe': StripeLogo,
      'epdq': BarclaysLogo,
      'smartpay': BarclaysLogo
    }

    const profile = profileMap[this.props.event.event_type] || DefaultProfile
    const paymentTypeIcon = paymentTypeMap[this.props.event.card_brand] || UnknownIcon
    const paymentProviderIcon = providerLogoMap[this.props.event.payment_provider]

    let statusIcon: string

    if (this.props.event.event_type === 'PAYMENT_DETAILS_ENTERED') {
      statusIcon = paymentTypeIcon
    } else if (eventsSuccess.includes(this.props.event.event_type)) {
      statusIcon = StatusSuccessIcon
    } else {
      statusIcon = StatusFailureIcon
    }

    let icon: JSX.Element

    if (this.props.event.event_type === 'PAYMENT_CREATED') {
      icon = <CardImage image={paymentProviderIcon} />
    } else {
      icon = <CardIcon icon={statusIcon} />
    }
    // switch (this.props.event.event_type) {
    //   case 'PAYMENT_DETAILS_ENTERED':
    //     icon = <CardIcon icon={paymentTypeIcon} />
    //     break
    //   case 'ERROR_GATEWAY':
    //     icon = <CardIcon icon={StatusFailureIcon} />
    //     break
    //   case 'AUTHORISATION_SUCCEEDED':
    //     icon = <CardIcon icon={StatusSuccessIcon} />
    //     break
    //   case 'PAYMENT_CREATED':
    //     icon = <CardImage image={paymentProviderIcon} />
    //   break
    // }

    return (
      <OpacitySpring>
        <div className="event-card govuk-!-margin-bottom-2" style={{ backgroundColor: profile.backgroundColour }}>
          <div style={{ textAlign: 'right', width: '100%' }}>
            <span className="govuk-body-s" style={{ color: profile.colour, opacity: 0.7 }}>
              {this.props.event.service_name}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
            {icon}
            <div>
            <span className="govuk-body-l" style={{ color: profile.colour }}><strong>
              {currencyFormatter.format(this.props.event.amount / 100)}
            </strong></span>
            </div>
          </div>
        </div>
      </OpacitySpring>
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

const numberFormatter = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0
})

interface ValueSpringProps {
  value: number,
  formatter: Intl.NumberFormat
}

const ValueSpring = (props: ValueSpringProps) => {
  const springProps = useSpring({
    value: props.value
  })

  return (
    <animated.span>
      {springProps.value.interpolate((x) => props.formatter.format(x))}
    </animated.span>
  )
}

// this top level method has to be any type right now as of
// https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20356
const OpacitySpring: any = (divProps: any) => {
  const transitions = useTransition(true, null, {
    from: { opacity: 0 },
    enter: { opacity: 1 },
    leave: { opacity: 1 }
  })

  return transitions.map(({ item, key, props }) => (
    <animated.div key={key} style={props}>
      {divProps.children}
    </animated.div>
  ))
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
    const completionRate = this.props.all.total_volume ? (this.props.completed.total_volume / this.props.all.total_volume) * 100 : 0
    return (
      <div ref={this.setPanelRef} className="dashboard-card">
        <span className="govuk-caption-xl">Payments</span>
        <h1 className="govuk-heading-xl">
          <ValueSpring
            value={this.props.completed.total_volume}
            formatter={numberFormatter}
          />
          {/* {numberFormatter.format(this.props.completed.total_volume)} */}
        </h1>
        <span className="govuk-caption-xl">Gross volume</span>
        <h1 className="govuk-heading-xl">
          <ValueSpring
            value={this.props.completed.total_amount / 100}
            formatter={currencyFormatter}
          />
          {/* {currencyFormatter.format(this.props.completed.total_amount / 100)} */}
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
                {/* {numberFormatter.format(this.props.all.total_volume)} */}
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
                {/* {currencyFormatter.format(this.props.all.total_amount / 100)} */}
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
                {/* {completionRate}% */}
              </td>
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

interface DashboardProps {
  tickInterval: number
}

interface DashboardState {
  statsHeight: number,
  events: Event[],
  date: moment.Moment,
  compareDate: moment.Moment,
  compareGraphs: boolean,
  transactionVolumesByHour: Serie[],
  aggregateCompletedVolumes: DailyVolumeReport,
  aggregateAllVolumes: DailyVolumeReport,
  queuedEvents: Event[],
  activeEvents: Event[],
  services: {[key: string]: string},
  lastFetchedEvents?: moment.Moment,
  tick?: number
}

const cachedSuccess: {[ key: string]: boolean} = {}

const eventsSuccess = [
  'CAPTURE_CONFIRMED',
  'CAPTURE_SUBMITTED',
  'USER_APPROVED_FOR_CAPTURE',
  'SERVICE_APPROVED_FOR_CAPTRUE'
]

const eventsErrored = [
  'GATEWAY_ERROR_DURING_AUTHORISATION',
  'GATEWAY_TIMEOUT_DURING_AUTHORISATION',
  'UNEXPECTED_GATEWAY_ERROR_DURING_AUTHORISATION',
  'CAPTURE_ERRORED',
  'CAPTURE_ABANDONED_AFTER_TOO_MANY_RETRIES'
]
const supportedEvents = [
  'PAYMENT_CREATED',
  'PAYMENT_DETAILS_ENTERED',
  ...eventsSuccess,
  ...eventsErrored
]

const MAX_ACTIVE_TICKER_EVENTS = 10

class Dashboard extends React.Component<DashboardProps, DashboardState> {
  interval?: NodeJS.Timeout

  constructor(props: DashboardProps) {
    super(props)

    // const now = moment().subtract(1, 'days')
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
      aggregateCompletedVolumes: zeroed,
      queuedEvents: [],
      activeEvents: [],
      services: {}
    }
    this.setWatchObserver = this.setWatchObserver.bind(this)

    this.init()
  }

  async init() {
    // also get or accept (passed down through props) list of services for me to map gateway accounts to
    this.fetchTransactionVolumesByHour()
    await this.fetchAggregateVolumes()
    await this.fetchServiceInfo()
    this.fetchEventTicker()

    this.setState({
      tick: Date.now()
    })
    this.interval = setInterval(() => {
      if (Date.now() - this.state.tick > (this.props.tickInterval * 1000)) {
        this.setState({
          tick: Date.now()
        })
        this.fetchEventTicker()
      }
      this.processQueuedEvents(Date.now())
    }, 100)
  }

  processQueuedEvents(timestamp: number) {
    const cursor = timestamp - (this.props.tickInterval * 3000)
    const filtered: Event[] = []
    const staging: Event[] = []

    let optimisticCompletedVolume = 0
    let optimisticCompletedAmount = 0
    let allCompletedVolume = 0
    let allCompletedAmount = 0
    // const staging = this.state.queuedEvents.filter((event) => event.timestamp < cursor)

    // @FIXME(sfount) don't go through ALL queued events - they are ordered by date, just do until the critera no longer matches
    // @TODO(sfount) consider what this looks like for pushed events from a pub/ sub
    this.state.queuedEvents.forEach((event) => {
      if (event.timestamp < cursor) {

        // @TODO(sfount) one of success final states

        if (eventsSuccess.includes(event.event_type)) {
          if (!cachedSuccess[event.resource_external_id]) {
            cachedSuccess[event.resource_external_id] = true
            optimisticCompletedAmount += event.amount
            optimisticCompletedVolume += 1
          }
        }

        if (event.event_type === 'PAYMENT_CREATED') {
          allCompletedAmount += event.amount
          allCompletedVolume += 1
        }
        staging.unshift(event)
      } else {
        filtered.push(event)
      }
    })

    if (
      optimisticCompletedAmount ||
      optimisticCompletedVolume ||
      allCompletedAmount ||
      allCompletedVolume ||
      staging.length
    ) {

      // update [0] for errored payments
      // update [1] for successful
      // update [2] for successful and created
      const updated = [ ...this.state.transactionVolumesByHour ]

      // @FIXME(sfount) glitch with receiving the same batch of events twice
      this.setState({
        queuedEvents: filtered,
        activeEvents: [
          ...this.state.activeEvents,
          ...staging
        ].slice(-MAX_ACTIVE_TICKER_EVENTS),
        aggregateCompletedVolumes: {
          ...this.state.aggregateCompletedVolumes,
          total_amount: this.state.aggregateCompletedVolumes.total_amount + optimisticCompletedAmount,
          total_volume: this.state.aggregateCompletedVolumes.total_volume + optimisticCompletedVolume
        },
        aggregateAllVolumes: {
          ...this.state.aggregateAllVolumes,
          total_amount: this.state.aggregateAllVolumes.total_amount + allCompletedAmount,
          total_volume: this.state.aggregateAllVolumes.total_volume + allCompletedVolume
        },
        transactionVolumesByHour: [
          ...this.state.transactionVolumesByHour
        ]
      })
    }
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
    const timestamp = moment()
    const completedResponse = await fetch(
      `/api/platform/aggregate?date=${this.state.date.utc().format()}&state=SUCCESS`
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
      aggregateAllVolumes: allData,
      ...!this.state.lastFetchedEvents && {
        lastFetchedEvents: timestamp
      }
    })
  }

  // @FIXME(sfount) only call .json() if the ok === true
  async fetchEventTicker() {
    console.log(`Fetching events from ${this.state.lastFetchedEvents.utc()}`)
    const response = await fetch(
      `/api/platform/ticker?since=${this.state.lastFetchedEvents.utc().format()}`
    )
    const timestamp = moment()
    const data = await response.json()

    // 1. ensure this is ordered by event date
    // 2. filter by only events that this consumer cares about
    // 3. add service name etc.
    // @FIXME(sfount) amount should come from ledger
    const parsed = data
      .filter((event: Event) => {
        return supportedEvents.includes(event.event_type)
      })
      .filter((event: Event) => {
        return !cachedSuccess[event.resource_external_id]
      })
      .map((event: Event) => {
        event.service_name = this.state.services[event.gateway_account_id]
        event.timestamp = moment(event.event_date).unix()

        return event
      })

    const resources = parsed.map((event: Event) => event.resource_external_id)
    // IQ200 - remove duplicated if they are all success events
    const unique = parsed.filter((v: Event, i: number) => !eventsSuccess.includes(v.event_type) || resources.indexOf(v.resource_external_id) === i)

    this.setState({
      lastFetchedEvents: timestamp,
      queuedEvents: this.state.queuedEvents.concat(unique)
    })
    console.log('got events', data)
  }

  // @FIXME(sfount) this should be passed in through props using SSR
  async fetchServiceInfo() {
    const response = await fetch('/api/platform/services')
    const data = await response.json()

    this.setState({
      services: data
    })
  }

  render() {
    console.log('rendering mdude')
    // @TODO(sfount) prop key should be the events id (which will actually come from the ledger resource)
    // @FIXME(sfount) move event iteration + handling to another component
    // const sorted = [...this.state.activeEvents].reverse()
    const events = this.state.activeEvents.map((event, index) => {
      return (
        <EventCard key={index} event={event} />
      )
    }).reverse()
    const compareGraphString = this.state.compareGraphs ?
      ` (${this.state.compareDate.format('dddd Do MMMM YYYY')})` :
      ''
    return (
      <div>
        <div className="govuk-grid-row govuk-body govuk-!-margin-bottom-4">
          {/* @TODO(sfount) bottom shadow (without factoring in column padding) is needed for parity */}
          {/* Non-zero min-height to maintain width without content (a loading or syncing icon should be used) */}
          <div style={{ maxHeight: this.state.statsHeight, overflowY: 'hidden', minHeight: 5 }} className="govuk-grid-column-one-half">
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
        <Dashboard tickInterval={5} />
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