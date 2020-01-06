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
      ...eventsActiveSuccess.reduce((aggregate: any, event) => {
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
    } else if (eventsActiveSuccess.includes(this.props.event.event_type)) {
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
  lastFetchedEvents?: moment.Moment
  // tick?: number
}

const cachedSuccess: {[ key: string]: boolean} = {}

const eventsSuccess = [
  'CAPTURE_CONFIRMED',
  'CAPTURE_SUBMITTED',
  'USER_APPROVED_FOR_CAPTURE',
  'SERVICE_APPROVED_FOR_CAPTRUE'
]

// only include the first salient successful event - this will mitigate background processes capturing old payments from
// impacting optimistic numbers
const eventsActiveSuccess = [
  'USER_APPROVED_FOR_CAPTURE_AWAITING_SERVICE_APPROVAL',
  'USER_APPROVED_FOR_CAPTURE',
  'SERVICE_APPROVED_FOR_CAPTURE'
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
  ...eventsActiveSuccess,
  ...eventsErrored
]

const MAX_ACTIVE_TICKER_EVENTS = 10

let tick: number = null

let aggregateTick: number = null

const aggregateSyncFrequency = 30 * 60 * 1000

function calculateComparisonDate(date: moment.Moment): moment.Moment {
  const comparison = date.clone()
  comparison.subtract(1, 'year')

  // hack for Sunday being the first day
  if(date.get('day') === 0) {
    comparison.add(1, 'week')
  }
  comparison.set('day', date.get('day'))
  // comparison.set('')
  return comparison
}

class Dashboard extends React.Component<DashboardProps, DashboardState> {
  interval?: NodeJS.Timeout

  constructor(props: DashboardProps) {
    super(props)

    // const now = moment().subtract(2, 'days')
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
      compareDate: calculateComparisonDate(now),
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
    this.fetchEventTicker(
      moment().utc().subtract(3, 'minutes'),
      moment().utc(),
      true
    )
    // this.fetchEventTicker()

    // tick probably doesn't need to be tracked by state
    tick = Date.now()
    aggregateTick = Date.now()
    // this.setState({
      // tick: Date.now()
    // })
    this.interval = setInterval(() => {
      const millisecondsElapsed = Date.now() - tick

      const millsecondsSincePreviousFetch = Date.now() - this.state.lastFetchedEvents.valueOf()

      if (Date.now() - aggregateTick > aggregateSyncFrequency) {
        console.log('aggregate sync')
        // 1. fetch aggregate volumes for 5 seconds ago (1 props.tickInterval)
        // 2. fetch transaction volumes by hour for this hour and the last hour (ovverride for 5 seconds ago)
        // 3. set a flag to indicate that in 5 seconds the numbers should be overriden with what we got here
        // OR
        // 3. set a timeout for props.tickInterval and just have that set (maybe easiest within this closure)
        // OR
        // 3. set a flag that will now run within this loop and only set aggregateTick once that's complete and the values have been updated
      }

      if (millsecondsSincePreviousFetch > (this.props.tickInterval * 1000 * 2)) {
      // const delayed = Date.now() - tick - (this.props.tickInterval)
      // console.log('Delayed', delayed)

      // const requestEventsWindow = delayed - this.props.tickInterval

      // const previousRequest = this.state.lastFetchedEvents.valueOf() - Date.now()

      // const difference = requestEventsWindow - previousRequest

      // console.log('Request events window', requestEventsWindow)
      // console.log('Previous request', previousRequest)
      // console.log('Difference', difference)

      // if (Date.now() - tick > (this.props.tickInterval * 1000)) {
      // if we're at the tick interval past our previous fetch
      // valueOf will give us milliseconds since epoch (similar to Date.now())
      // if (difference > (this.props.tickInterval * 1000)) {
        // this.setState({
          // tick: Date.now()
        // })
        tick = Date.now()

        // from fetch event ticker
        // format being passed to from and to date should be at millisecond precision, they will be run through `ZonedDateTime.parse()` which should support this
        // exmample: 2020-01-05T16:16:53.998568Z
        // `${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS')}Z`

        const fromDate = this.state.lastFetchedEvents
        const toDate = this.state.lastFetchedEvents.clone().add(this.props.tickInterval, 'seconds').utc()

        this.fetchEventTicker(fromDate, toDate, false)
      }
      this.processQueuedEvents(Date.now())
    }, 100)
  }

  processQueuedEvents(timestamp: number) {
    const cursor = timestamp - (this.props.tickInterval * 1000 * 2)
    const filtered: Event[] = []
    const staging: Event[] = []

    const stagingAggregateCompletedVolumes = { ...this.state.aggregateCompletedVolumes }
    const stagingAggregateAllVolumes = { ...this.state.aggregateAllVolumes }
    const stagingTransactionVolumesByHour = [ ...this.state.transactionVolumesByHour ]

    // const staging = this.state.queuedEvents.filter((event) => event.timestamp < cursor)

    // @FIXME(sfount) don't go through ALL queued events - they are ordered by date, just do until the critera no longer matches
    // @TODO(sfount) consider what this looks like for pushed events from a pub/ sub
    this.state.queuedEvents.forEach((event) => {
      console.log('event timestamp', event.timestamp)
      console.log('cursor', cursor)
      console.log('difference', event.timestamp - cursor)
      if (event.timestamp - cursor < 0) {

        // @TODO(sfount) one of success final states

        if (eventsActiveSuccess.includes(event.event_type)) {
          if (!cachedSuccess[event.resource_external_id]) {
            cachedSuccess[event.resource_external_id] = true
            stagingAggregateCompletedVolumes.total_amount += event.amount
            stagingAggregateCompletedVolumes.total_volume += 1
            // optimisticCompletedAmount += event.amount
            // optimisticCompletedVolume += 1

            const index = moment(event.timestamp).hour()
            const currentValue = stagingTransactionVolumesByHour[1].data[index].y as number
            stagingTransactionVolumesByHour[1].data[index].y = currentValue + 1
          }
        }

        if (event.event_type === 'PAYMENT_CREATED') {
          stagingAggregateAllVolumes.total_amount += event.amount
          stagingAggregateAllVolumes.total_volume += 1
          // allCompletedAmount += event.amount
          // allCompletedVolume += 1

          const index = moment(event.timestamp).hour()
          const currentValue = stagingTransactionVolumesByHour[2].data[index].y as number
          stagingTransactionVolumesByHour[2].data[index].y = currentValue + 1
        }

        if (eventsErrored.includes(event.event_type)) {
          const index = moment(event.timestamp).hour()
          const currentValue = stagingTransactionVolumesByHour[0].data[index].y as number
          stagingTransactionVolumesByHour[0].data[index].y = currentValue + 1
        }
        staging.unshift(event)
      } else {
        filtered.push(event)
      }
    })

    if (staging.length) {

      // @FIXME(sfount) @TODO(sfount) optimistic update of graph with info
      // @@IXME(sfount) @TODO(sfount) 30 minutely resets to aggregate data for both graph and stats
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
        aggregateCompletedVolumes: stagingAggregateCompletedVolumes,
        aggregateAllVolumes: stagingAggregateAllVolumes,
        transactionVolumesByHour: stagingTransactionVolumesByHour
        // aggregateCompletedVolumes: {
        //   ...this.state.aggregateCompletedVolumes,
        //   total_amount: this.state.aggregateCompletedVolumes.total_amount + optimisticCompletedAmount,
        //   total_volume: this.state.aggregateCompletedVolumes.total_volume + optimisticCompletedVolume
        // },
        // aggregateAllVolumes: {
        //   ...this.state.aggregateAllVolumes,
        //   total_amount: this.state.aggregateAllVolumes.total_amount + allCompletedAmount,
        //   total_volume: this.state.aggregateAllVolumes.total_volume + allCompletedVolume
        // },
        // transactionVolumesByHour: [
        //   ...this.state.transactionVolumesByHour
        // ]
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
      transactionVolumesByHour: json(data, this.state.date, compareData, this.state.compareGraphs, this.state.compareDate)

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
        lastFetchedEvents: timestamp.utc()
      }
    })
  }

  // @FIXME(sfount) only call .json() if the ok === true
  async fetchEventTicker(fromDate: moment.Moment, toDate: moment.Moment, historicFetch: boolean) {
    const fromDateString = `${fromDate.format('YYYY-MM-DDTHH:mm:ss.SSSSSS')}Z`
    const toDateString = `${toDate.format('YYYY-MM-DDTHH:mm:ss.SSSSSS')}Z`

    console.log('Requesting events from', this.state.lastFetchedEvents.format(), 'to', toDate.format(), 'now(', moment().utc().format(), ')')
    console.log('Event window size (s)', this.state.lastFetchedEvents.diff(toDate, 'seconds'))
    console.log('From date diff (s)', this.state.lastFetchedEvents.diff(moment(), 'seconds'))
    console.log('To date diff (s)', toDate.diff(moment(), 'seconds'))

    const response = await fetch(
      `/api/platform/ticker?from=${fromDateString}&to=${toDateString}`
    )
    // const timestamp = moment()
    const data = await response.json()

    // @FIXME(sfount) only run gubbins IFF the result was ok()

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
        event.timestamp = moment(event.event_date).valueOf()

        return event
      })

    const resources = parsed.map((event: Event) => event.resource_external_id)
    // IQ200 - remove duplicated if they are all success events
    const unique = parsed.filter((v: Event, i: number) => !eventsActiveSuccess.includes(v.event_type) || resources.indexOf(v.resource_external_id) === i)

    if (unique.length) {
      console.log(`Fetched event ticker with from_date ${this.state.lastFetchedEvents.utc().format()}. Got ${unique.length} events`, data, unique)
    }

    // @TODO(sfount) should last fetched events only be updated if we got some data back??
    // @TODO(sfount) duplicated event issue may well be to do with not using millisecond precision on fetching
    // @TODO(sfount) only hour slices that are before the current hour should be 0'd - leave the later hours unset


    // @TODO(sfount) make this less confusing looking
    this.setState({
      ...!historicFetch && { lastFetchedEvents: toDate },
      ...unique.length && !historicFetch && {
        queuedEvents: this.state.queuedEvents.concat(unique)
      },
      ...unique.length && historicFetch && {
        activeEvents: this.state.activeEvents.concat(unique.reverse())
      }
    })
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
    // console.log('Rendering top level Dashboard - should state be being set here?')
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
              </span>
              <div className="govuk-body" style={{ height: 320 }}>
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