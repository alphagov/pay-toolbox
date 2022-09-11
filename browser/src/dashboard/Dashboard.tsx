import React from 'react'

import moment from 'moment'

import { ResizeObserver } from '@juggle/resize-observer'
import { Serie, Datum } from '@nivo/line'

import { Event } from './../../../src/web/modules/transactions/types/ledger'
import { StatsPanel } from './StatsPanel'
import { EventListPanel } from './EventListPanel'

import { ChartVolumePanel } from './ChartVolumePanel'

import { jsonToChartData, TimeseriesPoint } from './parser'
import { eventsActiveSuccess, eventsErrored, supportedEvents } from './events'

import {
  fetchTransactionVolumesByHour,
  fetchAggregateVolumes,
  fetchEventTicker,
  fetchServiceInfo,
  cachedSuccess,
  TransactionVolumesByHourResponse,
  AggregateVolumesResponse,
  EventTickerResponse,
  DailyVolumeReport
} from './ledgerResource'

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
  lastFetchedEvents?: moment.Moment
}

interface AggregateSyncCache {
  aggregateAllVolumes: DailyVolumeReport,
  aggregateCompletedVolumes: DailyVolumeReport,
  transactionVolumesByHourPatch: TimeseriesPoint[]
}

interface AggregateSyncProgress {
  timestamp: number,
  inProgress: boolean,
  cache: AggregateSyncCache
}

const aggregateSync: AggregateSyncProgress = {
  timestamp: null,
  inProgress: false,
  cache: null
}

const MAX_ACTIVE_TICKER_EVENTS = 10
let tick: number = null
let aggregateTick: number = null
const aggregateSyncFrequency = 30 * 60 * 1000

// @FIXME(sfount) having state outside of component props is risky in the long run
// re-structure this so it's out of the top level components responsibility
let fetching = false

export class Dashboard extends React.Component<DashboardProps, DashboardState> {
  interval?: NodeJS.Timeout

  constructor(props: DashboardProps) {
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
      compareDate: calculateComparisonDate(now),
      compareGraphs: true,
      transactionVolumesByHour: [],
      aggregateAllVolumes: zeroed,
      aggregateCompletedVolumes: zeroed,
      queuedEvents: [],
      activeEvents: []
    }
    this.setWatchObserver = this.setWatchObserver.bind(this)
    this.init()
  }

  async init() {
    const volumesByHour = await fetchTransactionVolumesByHour(
      this.state.date,
      this.state.compareDate,
      null,
      null,
      this.state.compareGraphs
    )
    this.setTransactionVolumeByHour(volumesByHour)

    const volumes = await fetchAggregateVolumes(this.state.date)
    this.setAggregateVolumes(volumes)

    await fetchServiceInfo()

    tick = Date.now()
    aggregateTick = Date.now()
    this.interval = setInterval(this.tick.bind(this), 100)
  }

  async tick() {
    const millsecondsSincePreviousFetch = Date.now() - this.state.lastFetchedEvents.valueOf()

    if (Date.now() - aggregateTick > aggregateSyncFrequency) {
      this.aggregateSync()
    }

    if ((millsecondsSincePreviousFetch > (this.props.tickInterval * 1000 * 2)) && !fetching) {
      tick = Date.now()
      const fromDate = this.state.lastFetchedEvents
      const toDate = this.state.lastFetchedEvents.clone().add(this.props.tickInterval, 'seconds').utc()
      fetching = true
      const eventTicker = await fetchEventTicker(fromDate, toDate, false, this.state.lastFetchedEvents)
      fetching = false
      this.setEventTicker(eventTicker)
    }
    this.processQueuedEvents(Date.now())
  }

  aggregateSync() {
    if (!aggregateSync.inProgress) {
      const fetchTime = moment(Date.now() - this.props.tickInterval * 1000).utc()
      aggregateSync.inProgress = true
      aggregateSync.timestamp = fetchTime.valueOf()
      Promise.all([
        fetchAggregateVolumes(this.state.date, fetchTime),
        fetchTransactionVolumesByHour(
          this.state.date,
          this.state.compareDate,
          fetchTime.hour() - 2,
          fetchTime.hour() - 1,
          false
        )
      ])
        .then(([ volumes, volumesByHour ]) => {
          aggregateSync.cache = {
            aggregateAllVolumes: volumes.aggregateAllVolumes,
            aggregateCompletedVolumes: volumes.aggregateCompletedVolumes,
            transactionVolumesByHourPatch: volumesByHour.data
          }
        })
    } else {

      if (Date.now() - (this.props.tickInterval * 1000 * 2) > aggregateSync.timestamp) {
        const stagingTransactionVolumesByHour  = [ ...this.state.transactionVolumesByHour ]
        aggregateSync.cache.transactionVolumesByHourPatch.forEach((hourSegment: TimeseriesPoint) => {
          const date = moment(hourSegment.timestamp)

          updateAggregateGraphNode(stagingTransactionVolumesByHour, date, 0, hourSegment.errored_payments)
          updateAggregateGraphNode(stagingTransactionVolumesByHour, date, 1, hourSegment.completed_payments)
          updateAggregateGraphNode(stagingTransactionVolumesByHour, date, 2, hourSegment.all_payments)
        })
        this.setState({
          aggregateAllVolumes: aggregateSync.cache.aggregateAllVolumes,
          aggregateCompletedVolumes: aggregateSync.cache.aggregateCompletedVolumes,
          transactionVolumesByHour: stagingTransactionVolumesByHour
        })

        console.log('Aggregate sync process completed at', Date.now())
        aggregateSync.inProgress = false
        aggregateSync.cache = null
        aggregateSync.timestamp = null
        aggregateTick = Date.now()
      }
    }
  }

  processQueuedEvents(timestamp: number) {
    const cursor = timestamp - (this.props.tickInterval * 1000 * 2)
    const filtered: Event[] = []
    const staging: Event[] = []

    const stagingAggregateCompletedVolumes = { ...this.state.aggregateCompletedVolumes }
    const stagingAggregateAllVolumes = { ...this.state.aggregateAllVolumes }
    const stagingTransactionVolumesByHour = [ ...this.state.transactionVolumesByHour ]

    // @TODO(sfount) don't go through ALL queued events - they are ordered by date, just do until the critera no longer matches
    this.state.queuedEvents.forEach((event) => {
      // @TODO(sfount) somehow duplicated events can be added here when the browser tab isn't focussed
      if (
        !this.state.activeEvents.map((event: Event) => event.key)
          .concat(staging.map((event: Event) => event.key))
          .includes(event.key)
      ) {
        if (event.timestamp - cursor < 0) {
          if (eventsActiveSuccess.includes(event.event_type)) {
            if (!cachedSuccess[event.resource_external_id]) {
              cachedSuccess[event.resource_external_id] = true
              stagingAggregateCompletedVolumes.total_amount += event.amount
              stagingAggregateCompletedVolumes.total_volume += 1
              updateStagingGraphNode(stagingTransactionVolumesByHour, event, 1)
            }
          }

          if (event.event_type === 'PAYMENT_CREATED') {
            stagingAggregateAllVolumes.total_amount += event.amount
            stagingAggregateAllVolumes.total_volume += 1
            updateStagingGraphNode(stagingTransactionVolumesByHour, event, 2)
          }

          if (eventsErrored.includes(event.event_type)) {
            updateStagingGraphNode(stagingTransactionVolumesByHour, event, 0)
          }
          staging.push(event)
        } else {
          filtered.push(event)
        }
      } else {
        console.log('ignoring event that was already staged', event.key)
      }
    })

    if (staging.length) {
      this.setState({
        queuedEvents: filtered,
        activeEvents: [
          ...staging.reverse(),
          ...this.state.activeEvents,
        ].slice(0, MAX_ACTIVE_TICKER_EVENTS),
        aggregateCompletedVolumes: stagingAggregateCompletedVolumes,
        aggregateAllVolumes: stagingAggregateAllVolumes,
        transactionVolumesByHour: stagingTransactionVolumesByHour
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

  setTransactionVolumeByHour(response: TransactionVolumesByHourResponse) {
    this.setState({
      transactionVolumesByHour: jsonToChartData(response.data, this.state.date, response.compareData, this.state.compareGraphs, this.state.compareDate)
    })
  }

  setAggregateVolumes(response: AggregateVolumesResponse) {
    const timeFetched = response.timeFetched || moment()
    this.setState({
      aggregateCompletedVolumes: response.aggregateCompletedVolumes,
      aggregateAllVolumes: response.aggregateAllVolumes,
      ...!this.state.lastFetchedEvents && {
        lastFetchedEvents: timeFetched.utc()
      }
    })
  }

  setEventTicker(response: EventTickerResponse) {
    // @TODO(sfount) make this less confusing looking
    this.setState({
      ...!response.historicFetch && { lastFetchedEvents: response.timeFetched },
      ...response.events.length && !response.historicFetch && {
        queuedEvents: this.state.queuedEvents.concat(response.events)
      },
      ...response.events.length && response.historicFetch && {
        activeEvents: this.state.activeEvents.concat(response.events.slice(-MAX_ACTIVE_TICKER_EVENTS))
      }
    })
  }

  render() {
    return (
      <div>

        <div className="govuk-grid-row govuk-body govuk-!-margin-bottom-5">
          <div className="govuk-grid-column-full">
            <header>
              <div className="event-card govuk-header__container" style={{ color: 'white', backgroundColor: 'black', paddingTop: '15px', borderBottomLeftRadius: '0px', borderBottomRightRadius: '0px' }}>
                <div className="govuk-header__logo" style={{ }}>
                  <span className="govuk-header__link govuk-header__link--homepage">
                    <span className="govuk-header__logotype">
                      <svg role="presentation" focusable="false" className="govuk-header__logotype-crown" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 132 97" height="32" width="36">
                        <path fill="currentColor" fillRule="evenodd" d="M25 30.2c3.5 1.5 7.7-.2 9.1-3.7 1.5-3.6-.2-7.8-3.9-9.2-3.6-1.4-7.6.3-9.1 3.9-1.4 3.5.3 7.5 3.9 9zM9 39.5c3.6 1.5 7.8-.2 9.2-3.7 1.5-3.6-.2-7.8-3.9-9.1-3.6-1.5-7.6.2-9.1 3.8-1.4 3.5.3 7.5 3.8 9zM4.4 57.2c3.5 1.5 7.7-.2 9.1-3.8 1.5-3.6-.2-7.7-3.9-9.1-3.5-1.5-7.6.3-9.1 3.8-1.4 3.5.3 7.6 3.9 9.1zm38.3-21.4c3.5 1.5 7.7-.2 9.1-3.8 1.5-3.6-.2-7.7-3.9-9.1-3.6-1.5-7.6.3-9.1 3.8-1.3 3.6.4 7.7 3.9 9.1zm64.4-5.6c-3.6 1.5-7.8-.2-9.1-3.7-1.5-3.6.2-7.8 3.8-9.2 3.6-1.4 7.7.3 9.2 3.9 1.3 3.5-.4 7.5-3.9 9zm15.9 9.3c-3.6 1.5-7.7-.2-9.1-3.7-1.5-3.6.2-7.8 3.7-9.1 3.6-1.5 7.7.2 9.2 3.8 1.5 3.5-.3 7.5-3.8 9zm4.7 17.7c-3.6 1.5-7.8-.2-9.2-3.8-1.5-3.6.2-7.7 3.9-9.1 3.6-1.5 7.7.3 9.2 3.8 1.3 3.5-.4 7.6-3.9 9.1zM89.3 35.8c-3.6 1.5-7.8-.2-9.2-3.8-1.4-3.6.2-7.7 3.9-9.1 3.6-1.5 7.7.3 9.2 3.8 1.4 3.6-.3 7.7-3.9 9.1zM69.7 17.7l8.9 4.7V9.3l-8.9 2.8c-.2-.3-.5-.6-.9-.9L72.4 0H59.6l3.5 11.2c-.3.3-.6.5-.9.9l-8.8-2.8v13.1l8.8-4.7c.3.3.6.7.9.9l-5 15.4v.1c-.2.8-.4 1.6-.4 2.4 0 4.1 3.1 7.5 7 8.1h.2c.3 0 .7.1 1 .1.4 0 .7 0 1-.1h.2c4-.6 7.1-4.1 7.1-8.1 0-.8-.1-1.7-.4-2.4V34l-5.1-15.4c.4-.2.7-.6 1-.9zM66 92.8c16.9 0 32.8 1.1 47.1 3.2 4-16.9 8.9-26.7 14-33.5l-9.6-3.4c1 4.9 1.1 7.2 0 10.2-1.5-1.4-3-4.3-4.2-8.7L108.6 76c2.8-2 5-3.2 7.5-3.3-4.4 9.4-10 11.9-13.6 11.2-4.3-.8-6.3-4.6-5.6-7.9 1-4.7 5.7-5.9 8-.5 4.3-8.7-3-11.4-7.6-8.8 7.1-7.2 7.9-13.5 2.1-21.1-8 6.1-8.1 12.3-4.5 20.8-4.7-5.4-12.1-2.5-9.5 6.2 3.4-5.2 7.9-2 7.2 3.1-.6 4.3-6.4 7.8-13.5 7.2-10.3-.9-10.9-8-11.2-13.8 2.5-.5 7.1 1.8 11 7.3L80.2 60c-4.1 4.4-8 5.3-12.3 5.4 1.4-4.4 8-11.6 8-11.6H55.5s6.4 7.2 7.9 11.6c-4.2-.1-8-1-12.3-5.4l1.4 16.4c3.9-5.5 8.5-7.7 10.9-7.3-.3 5.8-.9 12.8-11.1 13.8-7.2.6-12.9-2.9-13.5-7.2-.7-5 3.8-8.3 7.1-3.1 2.7-8.7-4.6-11.6-9.4-6.2 3.7-8.5 3.6-14.7-4.6-20.8-5.8 7.6-5 13.9 2.2 21.1-4.7-2.6-11.9.1-7.7 8.8 2.3-5.5 7.1-4.2 8.1.5.7 3.3-1.3 7.1-5.7 7.9-3.5.7-9-1.8-13.5-11.2 2.5.1 4.7 1.3 7.5 3.3l-4.7-15.4c-1.2 4.4-2.7 7.2-4.3 8.7-1.1-3-.9-5.3 0-10.2l-9.5 3.4c5 6.9 9.9 16.7 14 33.5 14.8-2.1 30.8-3.2 47.7-3.2z"></path>
                      </svg>
                      <span className="govuk-header__logotype-text" style={{ marginLeft: '5px' }}>GOV.UK</span>
                    </span> 
                    <span className="govuk-header__product-name">Pay</span>
                  </span>
                </div>
                <div className="govuk-header__content" style={{ paddingTop: "2px" }}>
                  <a href="#" className="govuk-header__link govuk-header__link--service-name govuk-header__service-name">{ this.state.date.format("D MMMM YYYY") }</a>
                </div>
              </div>
            </header>
          </div>
        </div>
        <div className="govuk-grid-row govuk-body govuk-!-margin-bottom-4">
          {/* @TODO(sfount) bottom shadow (without factoring in column padding) is needed for parity */}
          {/* Non-zero min-height to maintain width without content (a loading or syncing icon should be used) */}
          <div style={{ maxHeight: this.state.statsHeight, overflowY: 'hidden', minHeight: 5 }} className="govuk-grid-column-one-half">
            <EventListPanel events={this.state.activeEvents} />
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
            <ChartVolumePanel
              data={this.state.transactionVolumesByHour}
              compareDate={this.state.compareDate}
              compareGraphs={this.state.compareGraphs}
              date={this.state.date}
            />
          </div>
        </div>
      </div>
    )
  }
}

function updateStagingGraphNode(transactionVolumesByHour: Serie[], event: Event, pointIndex: number) {
  const index = moment(event.timestamp).hour()
  const point = transactionVolumesByHour[pointIndex].data[index] || { x: `${moment(event.timestamp).format('YYYY-MM-DDTHH')}:00:00.000000Z`, y: 0 }
  const currentValue = point.y as number
  transactionVolumesByHour[pointIndex].data[index] = { ...point, y: currentValue + 1}
}

function updateAggregateGraphNode(transactionVolumesByHour: Serie[],timestamp: moment.Moment, pointIndex: number, pointValue: number) {
  const hourIndex = timestamp.hour()
  const defaultPoint: Datum = { x: `${timestamp.format('YYYY-MM-DDTHH')}:00:00.000000Z` }

  transactionVolumesByHour[pointIndex].data[hourIndex] = {
    ...transactionVolumesByHour[pointIndex].data[hourIndex] || defaultPoint,
    y: pointValue
  }
}

function calculateComparisonDate(date: moment.Moment): moment.Moment {
  const comparison = date.clone()
  comparison.subtract(1, 'year')

  // hack for Sunday being the first day
  if(date.get('day') === 0) {
    comparison.add(1, 'week')
  }
  comparison.set('day', date.get('day'))
  return comparison
}