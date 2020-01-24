import React from 'react'

import moment from 'moment'

import ResizeObserver from '@juggle/resize-observer'
import { Serie } from '@nivo/line'

import { Event } from 'ledger'
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
    const eventTicker = await fetchEventTicker(
      moment().utc().subtract(1, 'minutes'),
      moment().utc(),
      true,
      this.state.lastFetchedEvents
    )
    this.setEventTicker(eventTicker)

    tick = Date.now()
    aggregateTick = Date.now()
    this.interval = setInterval(this.tick.bind(this), 100)
  }

  async tick() {
    const millsecondsSincePreviousFetch = Date.now() - this.state.lastFetchedEvents.valueOf()

    if (Date.now() - aggregateTick > aggregateSyncFrequency) {
      // see sync commit for explanation (should probably be removed)
      this.aggregateSync()
    }

    if (millsecondsSincePreviousFetch > (this.props.tickInterval * 1000 * 2)) {
      tick = Date.now()
      const fromDate = this.state.lastFetchedEvents
      const toDate = this.state.lastFetchedEvents.clone().add(this.props.tickInterval, 'seconds').utc()
      const eventTicker = await fetchEventTicker(fromDate, toDate, false, this.state.lastFetchedEvents)
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
          const index = date.hour()
          stagingTransactionVolumesByHour[0].data[index].y = hourSegment.errored_payments
          stagingTransactionVolumesByHour[1].data[index].y = hourSegment.completed_payments
          stagingTransactionVolumesByHour[2].data[index].y = hourSegment.all_payments
        })
        this.setState({
          aggregateAllVolumes: aggregateSync.cache.aggregateAllVolumes,
          aggregateCompletedVolumes: aggregateSync.cache.aggregateCompletedVolumes,
          transactionVolumesByHour: stagingTransactionVolumesByHour
        })

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