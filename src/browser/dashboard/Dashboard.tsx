import React from 'react'

import moment from 'moment'

import ResizeObserver from '@juggle/resize-observer'
import { Serie } from '@nivo/line'

import { Event } from 'ledger'
import { StatsPanel } from './StatsPanel'
import { EventCard } from './EventCard'
import { VolumesByHourChart } from './Chart'

import { jsonToChartData, TimeseriesPoint } from './parser'
import { eventsActiveSuccess, eventsErrored, supportedEvents } from './events'

// StatsPanel
// EventsPanel
// ChartPanel

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

// @TODO(sfount) move interfaces to types file
export interface DailyVolumeReport {
  total_volume: number,
  total_amount: number,
  average_amount: number
}

interface AggregateSyncCache {
  aggregateAllVolumes: DailyVolumeReport,
  aggregateCompletedVolumes: DailyVolumeReport,
  transactionVolumesByHourPatch: TimeseriesPoint[]
}

interface AggregateVolumesResponse {
  timeFetched?: moment.Moment,
  aggregateAllVolumes: DailyVolumeReport,
  aggregateCompletedVolumes: DailyVolumeReport
}

interface TransactionVolumesByHourResponse {
  data: TimeseriesPoint[],
  compareData: TimeseriesPoint[]
}

interface AggregateSyncProgress {
  timestamp: number,
  inProgress: boolean,
  cache: AggregateSyncCache
}

const cachedSuccess: {[ key: string]: boolean} = {}

const aggregateSync: AggregateSyncProgress = {
  timestamp: null,
  inProgress: false,
  cache: null
}

const MAX_ACTIVE_TICKER_EVENTS = 10

let tick: number = null

let aggregateTick: number = null

const aggregateSyncFrequency = 30 * 60 * 1000
// const aggregateSyncFrequency = 20 * 1000

function calculateComparisonDate(date: moment.Moment): moment.Moment {
  const comparison = date.clone()
  comparison.subtract(1, 'year')

  // hack for Sunday being the first day
  if(date.get('day') === 0) {
    comparison.add(1, 'week')
  }
  comparison.set('day', date.get('day'))

  // comparison.subtract(1, 'day')
  // comparison.set('')
  return comparison
}

export class Dashboard extends React.Component<DashboardProps, DashboardState> {
  interval?: NodeJS.Timeout

  constructor(props: DashboardProps) {
    super(props)

    // const now = moment().subtract(4, 'days')
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
      // transactionVolumesByHour: json([], now, [], false, null),
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
    const volumesByHour = await this.fetchTransactionVolumesByHour(null, null, this.state.compareGraphs)
    this.setTransactionVolumeByHour(volumesByHour)

    const volumes = await this.fetchAggregateVolumes()
    this.setAggregateVolumes(volumes)

    await this.fetchServiceInfo()
    this.fetchEventTicker(
      moment().utc().subtract(3, 'minutes'),
      moment().utc(),
      true
    )

    // tick probably doesn't need to be tracked by state
    tick = Date.now()
    aggregateTick = Date.now()
    this.interval = setInterval(() => {
      const millisecondsElapsed = Date.now() - tick

      const millsecondsSincePreviousFetch = Date.now() - this.state.lastFetchedEvents.valueOf()

      if (Date.now() - aggregateTick > aggregateSyncFrequency) {
        // 1. fetch aggregate volumes for 5 seconds ago (1 props.tickInterval)
        // 2. fetch transaction volumes by hour for this hour and the last hour (ovverride for 5 seconds ago)
        // 3. set a flag to indicate that in 5 seconds the numbers should be overriden with what we got here
        // OR
        // 3. set a timeout for props.tickInterval and just have that set (maybe easiest within this closure)
        // OR
        // 3. set a flag that will now run within this loop and only set aggregateTick once that's complete and the values have been updated

        // actual idea:
        // set aggregateSyncCache to the upper (toDate) timestamp used for each of the queries
        // IFF that timestamp is set AND the tick - the process cursor goes over it partially update to the fetched data


        // IF we haven't already started fetching the aggregate sync
        if (!aggregateSync.inProgress) {
          const fetchTime = moment(Date.now() - this.props.tickInterval * 1000).utc()
          console.log('Aggregate sync triggered - new request, polling for aggregate details', fetchTime.format('YYYY-MM-DDTHH:mm:ss.SSSSSS'))
          aggregateSync.inProgress = true
          aggregateSync.timestamp = fetchTime.valueOf()
          Promise.all([
            this.fetchAggregateVolumes(fetchTime),
            this.fetchTransactionVolumesByHour(fetchTime.hour() - 2, fetchTime.hour() - 1, false)
          ])
            .then(([ volumes, volumesByHour ]) => {
              console.log('Aggregate sync completed fetching data', moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS'))
              aggregateSync.cache = {
                aggregateAllVolumes: volumes.aggregateAllVolumes,
                aggregateCompletedVolumes: volumes.aggregateCompletedVolumes,
                transactionVolumesByHourPatch: volumesByHour.data
              }
            })
        } else {

          // We've already got the cache - set this appropriately when the timestamp is ready
          if (Date.now() - (this.props.tickInterval * 1000 * 2) > aggregateSync.timestamp) {
            console.log('Determined I should now be fitting in the aggregate info, setting and resetting', moment().utc().format('YYYY-MM-DDTHH:mm:ss.SSSSSS'), aggregateSync)

            const stagingTransactionVolumesByHour  = [ ...this.state.transactionVolumesByHour ]
            aggregateSync.cache.transactionVolumesByHourPatch.forEach((hourSegment: TimeseriesPoint) => {
              console.log('updating the hour', hourSegment)
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

      if (millsecondsSincePreviousFetch > (this.props.tickInterval * 1000 * 2)) {
        tick = Date.now()

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

    // @FIXME(sfount) don't go through ALL queued events - they are ordered by date, just do until the critera no longer matches
    // @TODO(sfount) consider what this looks like for pushed events from a pub/ sub
    this.state.queuedEvents.forEach((event) => {
      console.log('event timestamp', event.timestamp)
      console.log('cursor', cursor)
      console.log('difference', event.timestamp - cursor)
      if (event.timestamp - cursor < 0) {

        if (eventsActiveSuccess.includes(event.event_type)) {
          if (!cachedSuccess[event.resource_external_id]) {
            cachedSuccess[event.resource_external_id] = true
            stagingAggregateCompletedVolumes.total_amount += event.amount
            stagingAggregateCompletedVolumes.total_volume += 1

            const index = moment(event.timestamp).hour()
            const point = stagingTransactionVolumesByHour[1].data[index] || { x: `${moment(event.timestamp).format('YYYY-MM-DDTHH')}:00:00.000000Z`, y: 0 }
            const currentValue = point.y as number
            stagingTransactionVolumesByHour[1].data[index] = { ...point, y: currentValue + 1}
          }
        }

        if (event.event_type === 'PAYMENT_CREATED') {
          stagingAggregateAllVolumes.total_amount += event.amount
          stagingAggregateAllVolumes.total_volume += 1

          const index = moment(event.timestamp).hour()
          const point = stagingTransactionVolumesByHour[2].data[index] || { x: `${moment(event.timestamp).format('YYYY-MM-DDTHH')}:00:00.000000Z`, y: 0 }
          const currentValue = point.y as number
          stagingTransactionVolumesByHour[2].data[index] = { ...point, y: currentValue + 1}
        }

        if (eventsErrored.includes(event.event_type)) {
          const index = moment(event.timestamp).hour()
          const point = stagingTransactionVolumesByHour[0].data[index] || { x: `${moment(event.timestamp).format('YYYY-MM-DDTHH')}:00:00.000000Z`, y: 0 }
          const currentValue = point.y as number
          stagingTransactionVolumesByHour[0].data[index] = { ...point, y: currentValue + 1}
        }
        staging.unshift(event)
      } else {
        filtered.push(event)
      }
    })

    if (staging.length) {
      const updated = [ ...this.state.transactionVolumesByHour ]

      this.setState({
        queuedEvents: filtered,
        activeEvents: [
          ...this.state.activeEvents,
          ...staging
        ].slice(-MAX_ACTIVE_TICKER_EVENTS),
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

  async fetchTransactionVolumesByHour(fromHour?: number, toHour?: number, compare: boolean = false): Promise<TransactionVolumesByHourResponse> {
    const query = `/api/platform/timeseries?date=${this.state.date.utc().format()}`
    const limit = fromHour && toHour ?
      `&fromHour=${fromHour}&toHour=${toHour}` :
      ''
    const response = await fetch(
      `${query}${limit}`
    )
    const data = await response.json()

    let compareData = []
    if (compare) {
      const compareResponse = await fetch(
        `/api/platform/timeseries?date=${this.state.compareDate.utc().format()}`
      )
      compareData = await compareResponse.json()
    }

    return {
      data, compareData
    }
  }

  setTransactionVolumeByHour(response: TransactionVolumesByHourResponse) {
    this.setState({
      transactionVolumesByHour: jsonToChartData(response.data, this.state.date, response.compareData, this.state.compareGraphs, this.state.compareDate)
    })
  }

  async fetchAggregateVolumes(limitTime?: moment.Moment): Promise<AggregateVolumesResponse> {
    const timestamp = moment()
    const limit = limitTime ? `&limit=${limitTime.format('YYYY-MM-DDTHH:mm:ss.SSSSSS')}Z` : ''
    const completedResponse = await fetch(
      `/api/platform/aggregate?date=${this.state.date.utc().format()}&state=SUCCESS${limit}`
    )
    const completedData = await completedResponse.json()

    // @FIXME(sfount) do these at the same time
    // @FIXME(sfount) add the state flag to this query
    const allResponse = await fetch(
      `/api/platform/aggregate?date=${this.state.date.utc().format()}`
    )
    const allData = await allResponse.json()

    return {
      timeFetched: timestamp,
      aggregateAllVolumes: allData,
      aggregateCompletedVolumes: completedData
    }
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

  // @FIXME(sfount) only call .json() if the ok === true
  async fetchEventTicker(fromDate: moment.Moment, toDate: moment.Moment, historicFetch: boolean) {
    const fromDateString = `${fromDate.format('YYYY-MM-DDTHH:mm:ss.SSSSSS')}Z`
    const toDateString = `${toDate.format('YYYY-MM-DDTHH:mm:ss.SSSSSS')}Z`

    const response = await fetch(
      `/api/platform/ticker?from=${fromDateString}&to=${toDateString}`
    )
    // const timestamp = moment()
    const data = await response.json()

    // @FIXME(sfount) only run gubbins IFF the result was ok()
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
        <EventCard key={event.resource_external_id + event.timestamp} event={event} />
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
                <VolumesByHourChart data={this.state.transactionVolumesByHour} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}