import React from 'react'

import moment from 'moment'

import { ResizeObserver } from '@juggle/resize-observer'
import { Serie } from '@nivo/line'

import { Event } from './../../../src/web/modules/transactions/types/ledger'
import { StatsPanel } from './StatsPanel'
import { EventListPanel } from './EventListPanel'

import { ChartVolumePanel } from './ChartVolumePanel'

import { jsonToChartData } from './parser'
import { eventsActiveSuccess, eventsErrored } from './events'

import {
  fetchTransactionVolumesByHour,
  fetchAggregateVolumes,
  fetchEventTicker,
  fetchServiceInfoAndReset,
  cachedSuccess,
  DailyVolumeReport
} from './ledgerResource'

interface DashboardProps {
  tickInterval: number
}

enum ConnectionStatus {
  CONNECTING, CONNECTED, DISCONNECTED, FAILED
}

interface DashboardState {
  statsHeight: number,
  events: Event[],
  date: moment.Moment,
  compareDate: moment.Moment,

  // move to config
  compareGraphs: boolean,

  // move to data
  transactionVolumesByHour: Serie[],
  aggregateCompletedVolumes: DailyVolumeReport,
  aggregateAllVolumes: DailyVolumeReport,
  queuedEvents: Event[],
  activeEvents: Event[],
  lastFetchedEvents?: moment.Moment,
  connection: DashboardConnectionState,
  lastSystemTick: number,
  lastConnectionTick: number,
  numberOfAggregateSyncs: number,

  fetchedServices: boolean,
  
  // move to sync: status property similar to connection rather than top level
  sync?: AggregateSyncStatus,
  showAllEvents: boolean
}

export interface AggregateSyncStatus {
  pending: boolean,
  timestampTick: number,
  data: PendingAggregateSync
}

interface PendingAggregateSync {
  aggregateAllVolumes: DailyVolumeReport,
  aggregateCompletedVolumes: DailyVolumeReport,
  transactionVolumesByHour: Serie[]
}

// the one place we're OK with having non-react state, this will be updated all the time
// and would cause the dashboard to be re-drawn _a lot_
let lastSystemTick: number | null = null 

const MAX_FAILED_CONNECTION_ATTEMPTS = 60
const MAX_ACTIVE_TICKER_EVENTS = 10
const aggregateSyncFrequency = 30 * 60 * 1000

interface DashboardConnectionState {
  isFetching: boolean,
  status: ConnectionStatus,
  attempts: number,
  lastWindowTimestamp?: number,
  lastFetchedEventsTimestamp?: number,
  lastAggregateSyncTimestamp?: number
}

const systemTickInterval = 1000

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
      numberOfAggregateSyncs: 0,
      queuedEvents: [],
      activeEvents: [],
      connection: {
        isFetching: false,
        status: ConnectionStatus.DISCONNECTED,
        attempts: 0
      },
      lastSystemTick: Date.now(),
      lastConnectionTick: Date.now(),
      fetchedServices: false,
      showAllEvents: false
    }
    this.setWatchObserver = this.setWatchObserver.bind(this)
    this.init()
  }

  async init() {
    this.interval = setInterval(this.tick.bind(this), 100)
  }

  async tick() {
    const windowBufferMs = (this.props.tickInterval * 2 * 2) * 1000
    const now = Date.now()
    const windowNow = now - windowBufferMs

    if (moment(now).get('date') !== this.state.date.get('date')) {
      log(now, windowNow, 'Resetting for a new date')
      this.setState({
        fetchedServices: false,
        date: moment(),
        compareDate: calculateComparisonDate(moment(now)),
        connection: {
          ...this.state.connection,
          status: ConnectionStatus.DISCONNECTED
        }
      })
      return
    }
      if (this.state.connection.isFetching === false) {
        switch (this.state.connection.status) {
          case ConnectionStatus.DISCONNECTED:
            // kick off an aggregate sync and then say we are connected
            if (this.state.connection.attempts > MAX_FAILED_CONNECTION_ATTEMPTS) {
              log(now, windowNow, `Failed to connect more than ${MAX_FAILED_CONNECTION_ATTEMPTS} times.`)
              this.setState({
                connection: {
                  ...this.state.connection,
                  status: ConnectionStatus.FAILED
                },
                sync: undefined
              })
            } else { 
              // attempt to connect, fetch an aggregate sync and when that's complete set the events fetched since to now
              // backoff and try slower given more attempts
              if ((now - this.state.lastConnectionTick) > (this.state.connection.attempts * systemTickInterval)) {
                log(now, windowNow, `Attempting to connect, time since last attempt ${now - this.state.lastConnectionTick}ms`)
                this.setState({
                  connection: {
                    ...this.state.connection,
                    isFetching: true,
                    attempts: this.state.connection.attempts + 1
                  }
                })
                
                const syncBufferTimestamp = windowNow + (this.props.tickInterval * 2) * 1000
                Promise.resolve()
                  .then((): any => {
                    if (!this.state.fetchedServices) {
                      return fetchServiceInfoAndReset()
                    } else {
                      return false
                    }
                  })
                  .then((maybeServiceResult) => {
                    if (maybeServiceResult) {
                      this.setState({
                        fetchedServices: true
                      })
                    }
                    return this.fetchAggregateSync(moment(syncBufferTimestamp).utc())
                  })
                  .then((result) => {
                    log(now, windowNow, 'Connected: fetched aggregate sync', { limit: moment(syncBufferTimestamp).utc().format() })
                    this.setState({
                      connection: {
                        ...this.state.connection,
                        isFetching: false,
                        status: ConnectionStatus.CONNECTED,
                        lastAggregateSyncTimestamp: now,
                        lastWindowTimestamp: syncBufferTimestamp,
                        lastFetchedEventsTimestamp: undefined,
                        attempts: 0
                      },
                      lastConnectionTick: now,
                      numberOfAggregateSyncs: 1,
                      sync: {
                        pending: true,
                        data: result,
                        timestampTick: syncBufferTimestamp
                      },
                      queuedEvents: []
                    })
                  })
                  .catch((error) => {
                    log(now, windowNow, 'Error during connection attempt', error)
                    this.setState({
                      connection: {
                        ...this.state.connection,
                        isFetching: false,
                        status: ConnectionStatus.DISCONNECTED
                      },
                      lastConnectionTick: now
                    })
                  })
              }
            }
            break
          case ConnectionStatus.CONNECTED:

            // 1. check aggregate first to give that the most time, there should be buffer between event window checks anyway
            // 2. then check if there's no last checked event window - thats a trigger 
            // 3. then check if the current window time is > interval 
            if (this.state.sync && this.state.sync.pending) {

              if (windowNow >= this.state.sync.timestampTick) {
                log(now, windowNow, 'Applying pending aggregate sync')
          
                // remove any events fetched from before the aggregate sync, this should be an outlier
                const stagedQueued = this.state.queuedEvents.filter((event) => event.timestamp && event.timestamp >= windowNow)

                this.setState({
                  ...this.state.sync.data,
                  queuedEvents: stagedQueued,
                  sync: undefined
                })
              }
            } 

            if (
              !(this.state.sync && this.state.sync.pending) &&
              this.state.connection.lastAggregateSyncTimestamp && (now - this.state.connection.lastAggregateSyncTimestamp) > aggregateSyncFrequency
            ) {
              log(now, windowNow, 'Getting a scheduled aggregate sync')
              this.setState({
                connection: {
                  ...this.state.connection,
                  isFetching: true
                }
              })
              
              const syncBufferTimestamp = windowNow + (this.props.tickInterval * 2) * 1000
              this.fetchAggregateSync(moment(syncBufferTimestamp).utc())
                .then((result) => {

                  log(now, windowNow, 'Got the data for a scheduled aggregate sync', { limit: moment(syncBufferTimestamp).utc().format() })
                  this.setState({
                    connection: {
                      ...this.state.connection,
                      isFetching: false,
                      lastAggregateSyncTimestamp: now,
                    },
                    sync: {
                      pending: true,
                      data: result,
                      timestampTick: syncBufferTimestamp
                    },
                    numberOfAggregateSyncs: this.state.numberOfAggregateSyncs + 1
                  })
                })
                .catch((error) => {
                  log(now, windowNow, 'Error during scheduled aggregate sync')
                  this.setState({
                    connection: {
                      ...this.state.connection,
                      isFetching: false,
                      status: ConnectionStatus.DISCONNECTED
                    }
                  })
                })
            } else if (
              !this.state.connection.lastFetchedEventsTimestamp || 
              this.state.connection.lastFetchedEventsTimestamp && (now - this.state.connection.lastFetchedEventsTimestamp) > this.props.tickInterval * 1000
            ) {
              this.setState({
                connection: {
                  ...this.state.connection,
                  isFetching: true
                }
              })
              const from = moment(this.state.connection.lastWindowTimestamp).utc()
              const to = moment(windowNow).add(this.props.tickInterval * 3, 'seconds').utc()
              const differenceDrift = from.valueOf() - windowNow
              const windowSize = to.valueOf() - from.valueOf()

              // also have a kill switch on the window size
              if (differenceDrift < this.props.tickInterval * 1000) {
                log(now, windowNow, `Detected too much drift between the window and current time window size(${windowSize}ms) drift(${differenceDrift}ms)`)
                this.setState({
                  connection: {
                    ...this.state.connection,
                    isFetching: false,
                    status: ConnectionStatus.DISCONNECTED
                  },
                  lastConnectionTick: now
                })
                return
              }
              log(now, windowNow, `Fetch event window ${from.format(format)} ${to.format(format)} window size(${windowSize}ms) drift(${differenceDrift}ms)`)
              fetchEventTicker(from, to)
                .then((result) => {
                  this.setState({
                    queuedEvents: [
                      ...this.state.queuedEvents,
                      ...result.events
                    ],
                    connection: {
                      ...this.state.connection,
                      isFetching: false,
                      lastFetchedEventsTimestamp: now,
                      lastWindowTimestamp: to.valueOf()
                    }
                  })
                })
                .catch((error) => {
                  log(now, windowNow, 'Error during fetching event window')
                  this.setState({
                    connection: {
                      ...this.state.connection,
                      isFetching: false,
                      status: ConnectionStatus.DISCONNECTED
                    }
                  })
                })
            }
            break
          case ConnectionStatus.FAILED:
            // unhook this tick listener, we don't need to continue evaluating
            break
          default:
            break
        }
      }

    lastSystemTick = now
    // no matter what we're doing with our connection, check to see if we've got queued non-processed events and have them surfaced
    this.processQueuedEvents(windowNow)
  }

  async fetchAggregateSync(timestampFrom: moment.Moment): Promise<PendingAggregateSync> {
    const [ volumes, volumesByHour ] = await Promise.all([
      fetchAggregateVolumes(timestampFrom, timestampFrom),
      // @FIXME(sfount) without providing a to-date (or limit) there's a reasonable small chance the aggregate and volumes by hour don't line up, this should be a very small discrepancy so could be addressed later
      fetchTransactionVolumesByHour(timestampFrom, this.state.compareDate, null, null, this.state.compareGraphs)
    ])

    return {
      aggregateAllVolumes: volumes.aggregateAllVolumes,
      aggregateCompletedVolumes: volumes.aggregateCompletedVolumes,
      transactionVolumesByHour: jsonToChartData(volumesByHour.data, this.state.date, volumesByHour.compareData, this.state.compareGraphs, this.state.compareDate)
    }
  }

  processQueuedEvents(cursor: number) {
    const filtered: Event[] = []
    const staging: Event[] = []
    const ignored: Event[] = []

    const stagingAggregateCompletedVolumes = { ...this.state.aggregateCompletedVolumes }
    const stagingAggregateAllVolumes = { ...this.state.aggregateAllVolumes }
    const stagingTransactionVolumesByHour = [ ...this.state.transactionVolumesByHour ]

    this.state.queuedEvents.forEach((event) => {
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

          // this line here actually lines up the event to be shown -- if the configuration option is not set to verbose it could only do this for successful events
          // once we've processed the event we should make sure it doesn't go into the "filtered" list as it shouldn't be picked back up
          if (this.state.showAllEvents || eventsActiveSuccess.includes(event.event_type)) {
            staging.push(event)
          } else {
            ignored.push(event)
          }
        } else {
          filtered.push(event)
        }
      } else {
        console.log('ignoring event that was already staged', event.key)
      }
    })

    if (staging.length || ignored.length) {
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

  setDisplayOptionEventTicker(e: React.FormEvent<HTMLInputElement>) {
    this.setState({
      showAllEvents: e.currentTarget.value === "true"
    })
  }

  render() {
    const headerStatusColourMap: { [key in ConnectionStatus]?: string } = {
      [ConnectionStatus.CONNECTED]: '#1d70b8',
      [ConnectionStatus.DISCONNECTED]: '#b1b4b6',
      [ConnectionStatus.FAILED]: '#d4351c'
    }

    return (
      <div>
        <div className="govuk-grid-row govuk-body govuk-!-margin-bottom-5">
          <div className="govuk-grid-column-full">
            <header>
              <div className="event-card govuk-header__container" style={{ color: 'white', backgroundColor: 'black', paddingTop: '15px', borderBottomLeftRadius: '0px', borderBottomRightRadius: '0px', borderBottomColor: headerStatusColourMap[this.state.connection.status] }}>
                <div className="govuk-header__logo" style={{ }}>
                  <span className="govuk-header__link govuk-header__link--homepage">
                    <span className="govuk-header__logotype">
                      <svg aria-hidden="true" focusable="false" className="govuk-header__logotype-crown" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 30" height="30" width="32">
                        <path fill="currentColor" fill-rule="evenodd" d="M22.6 10.4c-1 .4-2-.1-2.4-1-.4-.9.1-2 1-2.4.9-.4 2 .1 2.4 1s-.1 2-1 2.4m-5.9 6.7c-.9.4-2-.1-2.4-1-.4-.9.1-2 1-2.4.9-.4 2 .1 2.4 1s-.1 2-1 2.4m10.8-3.7c-1 .4-2-.1-2.4-1-.4-.9.1-2 1-2.4.9-.4 2 .1 2.4 1s0 2-1 2.4m3.3 4.8c-1 .4-2-.1-2.4-1-.4-.9.1-2 1-2.4.9-.4 2 .1 2.4 1s-.1 2-1 2.4M17 4.7l2.3 1.2V2.5l-2.3.7-.2-.2.9-3h-3.4l.9 3-.2.2c-.1.1-2.3-.7-2.3-.7v3.4L15 4.7c.1.1.1.2.2.2l-1.3 4c-.1.2-.1.4-.1.6 0 1.1.8 2 1.9 2.2h.7c1-.2 1.9-1.1 1.9-2.1 0-.2 0-.4-.1-.6l-1.3-4c-.1-.2 0-.2.1-.3m-7.6 5.7c.9.4 2-.1 2.4-1 .4-.9-.1-2-1-2.4-.9-.4-2 .1-2.4 1s0 2 1 2.4m-5 3c.9.4 2-.1 2.4-1 .4-.9-.1-2-1-2.4-.9-.4-2 .1-2.4 1s.1 2 1 2.4m-3.2 4.8c.9.4 2-.1 2.4-1 .4-.9-.1-2-1-2.4-.9-.4-2 .1-2.4 1s0 2 1 2.4m14.8 11c4.4 0 8.6.3 12.3.8 1.1-4.5 2.4-7 3.7-8.8l-2.5-.9c.2 1.3.3 1.9 0 2.7-.4-.4-.8-1.1-1.1-2.3l-1.2 4c.7-.5 1.3-.8 2-.9-1.1 2.5-2.6 3.1-3.5 3-1.1-.2-1.7-1.2-1.5-2.1.3-1.2 1.5-1.5 2.1-.1 1.1-2.3-.8-3-2-2.3 1.9-1.9 2.1-3.5.6-5.6-2.1 1.6-2.1 3.2-1.2 5.5-1.2-1.4-3.2-.6-2.5 1.6.9-1.4 2.1-.5 1.9.8-.2 1.1-1.7 2.1-3.5 1.9-2.7-.2-2.9-2.1-2.9-3.6.7-.1 1.9.5 2.9 1.9l.4-4.3c-1.1 1.1-2.1 1.4-3.2 1.4.4-1.2 2.1-3 2.1-3h-5.4s1.7 1.9 2.1 3c-1.1 0-2.1-.2-3.2-1.4l.4 4.3c1-1.4 2.2-2 2.9-1.9-.1 1.5-.2 3.4-2.9 3.6-1.9.2-3.4-.8-3.5-1.9-.2-1.3 1-2.2 1.9-.8.7-2.3-1.2-3-2.5-1.6.9-2.2.9-3.9-1.2-5.5-1.5 2-1.3 3.7.6 5.6-1.2-.7-3.1 0-2 2.3.6-1.4 1.8-1.1 2.1.1.2.9-.3 1.9-1.5 2.1-.9.2-2.4-.5-3.5-3 .6 0 1.2.3 2 .9l-1.2-4c-.3 1.1-.7 1.9-1.1 2.3-.3-.8-.2-1.4 0-2.7l-2.9.9C1.3 23 2.6 25.5 3.7 30c3.7-.5 7.9-.8 12.3-.8"></path>
                      </svg>
                      <span className="govuk-header__logotype-text" style={{ marginLeft: '5px' }}>GOV.UK</span>
                    </span> 
                    <span className="govuk-header__product-name">Pay</span>
                  </span>
                </div>
                <div className="govuk-header__content" style={{ paddingTop: "2px" }}>
                  <a href="#" className="govuk-header__link govuk-header__service-name">{ this.state.date.format("D MMMM YYYY") }</a>
                </div>
              </div>
            </header>
          </div>
        </div>
        <div className="govuk-grid-row govuk-body govuk-!-margin-bottom-4">
          <div className="govuk-grid-column-full">
            <div className="event-card" style={{ padding: '15px', paddingLeft: '20px', paddingRight: '20px' }}>
              <h1 className="govuk-heading-l">Live payments dashboard</h1>
              <p className="govuk-body-l" style={{ marginBottom: '20px' }}><a href="https://www.payments.service.gov.uk" className="govuk-link govuk-link--no-visited-state">GOV.UK Pay</a> is a free service, available to public sector organisations to take online payments.</p>
            </div>
          </div>
        </div>
        <div className="govuk-grid-row govuk-body govuk-!-margin-bottom-4">
          {/* Non-zero min-height to maintain width without content (a loading or syncing icon should be used) */}
          <div style={{ maxHeight: this.state.statsHeight, overflowY: 'hidden', minHeight: 5 }} className="govuk-grid-column-one-half">
            <EventListPanel events={this.state.activeEvents} sync={this.state.sync} numberOfAggregateSyncs={this.state.numberOfAggregateSyncs} fetchedServices={this.state.fetchedServices} isFetching={this.state.connection.isFetching} showAllEvents={this.state.showAllEvents} />
          </div>
          <div className="govuk-grid-column-one-half">
            <StatsPanel
              completed={this.state.aggregateCompletedVolumes}
              all={this.state.aggregateAllVolumes}
              watch={this.setWatchObserver}
            />
          </div>
        </div>
        <div className="govuk-grid-row govuk-!-margin-bottom-4">
          <div className="govuk-grid-column-full">
            <ChartVolumePanel
              data={this.state.transactionVolumesByHour}
              compareDate={this.state.compareDate}
              compareGraphs={this.state.compareGraphs}
              date={this.state.date}
            />
          </div>
        </div>
        <div className="govuk-grid-row">
          <div className="govuk-grid-column-full govuk-body">
          <details className="govuk-details" >
            <summary className="govuk-details__summary">
              <span className="govuk-details__summary-text">
                Display options
              </span>
            </summary>
            <div className="govuk-details__text">
              <div className="govuk-form-group">
                <fieldset className="govuk-fieldset">
                  <legend className="govuk-fieldset__legend govuk-fieldset__legend--m">
                    <h1 className="govuk-fieldset__heading">
                      Live payment events feed
                    </h1>
                  </legend>
                  <div className="govuk-radios govuk-radios--small" data-module="govuk-radios">
                    <div className="govuk-radios__item">
                      <input className="govuk-radios__input" id="changed-name" name="changed-name" type="radio" value="false" checked={ !this.state.showAllEvents } onChange={ this.setDisplayOptionEventTicker.bind(this) }></input>
                      <label className="govuk-label govuk-radios__label">
                        Only show payment succeeded events
                      </label>
                      <div id="sign-in-item-hint" className="govuk-hint govuk-radios__hint">
                        Show a card in the events feed when a payment has been successfully processed.
                      </div>
                    </div>
                    <div className="govuk-radios__item">
                      <input className="govuk-radios__input" id="changed-name-2" name="changed-name" type="radio" value="true" checked={ this.state.showAllEvents } onChange={ this.setDisplayOptionEventTicker.bind(this) }></input>
                      <label className="govuk-label govuk-radios__label">
                        Show all events
                      </label>
                      <div id="sign-in-item-hint-two" className="govuk-hint govuk-radios__hint">
                        Show cards for all payments events including when payments are created, when card details are provided and when a payment has been successfully processed.
                      </div>

                    </div>
                  </div>
                </fieldset>
              </div>
            </div>
          </details>
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

const format = 'HH:mm:ss'
function log(current: number, window: number, message: string, context?: any) {
  console.log(moment(current).utc().format(format), moment(window).utc().format(format), message)
  if (context) {
    console.log(context)
  }
}