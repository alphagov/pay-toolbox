import { TimeseriesPoint } from './parser'
import moment from 'moment'

import { eventsActiveSuccess, eventsErrored, supportedEvents } from './events'

import { Event } from './../../../src/web/modules/transactions/types/ledger'

export interface EventTickerResponse {
  timeFetched?: moment.Moment,
  historicFetch: boolean,
  events: Event[]
}

export interface TransactionVolumesByHourResponse {
  data: TimeseriesPoint[],
  compareData: TimeseriesPoint[]
}

export interface AggregateVolumesResponse {
  timeFetched?: moment.Moment,
  aggregateAllVolumes: DailyVolumeReport,
  aggregateCompletedVolumes: DailyVolumeReport
}

export interface DailyVolumeReport {
  total_volume: number,
  total_amount: number,
  average_amount: number
}

export const cachedSuccess: {[ key: string]: boolean} = {}
export let services: {[key: string]: string} = {}

export async function fetchTransactionVolumesByHour(
  date: moment.Moment,
  compareDate: moment.Moment,
  fromHour?: number,
  toHour?: number,
  compare: boolean = false
): Promise<TransactionVolumesByHourResponse> {
  const query = `/api/platform/timeseries?date=${date.utc().format()}`
  const limit = fromHour && toHour ?
    `&fromHour=${fromHour}&toHour=${toHour}` :
    ''
  const response = await fetch(`${query}${limit}`)

  if (response.ok) {
    const data = await response.json()

    let compareData = []
    if (compare) {
      const compareResponse = await fetch(
        `/api/platform/timeseries?date=${compareDate.utc().format()}`
      )
      compareData = await compareResponse.json()
    }

    return {
      data, compareData
    }
  }
}

export async function fetchAggregateVolumes(date: moment.Moment, limitTime?: moment.Moment): Promise<AggregateVolumesResponse> {
  const timestamp = moment()
  const limit = limitTime ? `&limit=${limitTime.format('YYYY-MM-DD')}` : ''

  const [ completedResponse, allResponse ] = await Promise.all([
    fetch(`/api/platform/aggregate?date=${date.utc().format()}&state=SUCCESS${limit}`),
    fetch(`/api/platform/aggregate?date=${date.utc().format()}`)
  ])

  if (completedResponse.ok && allResponse.ok) {
    const allData = await allResponse.json()
    const completedData = await completedResponse.json()


    return {
      timeFetched: timestamp,
      aggregateAllVolumes: allData,
      aggregateCompletedVolumes: completedData
    }
  }
}

export async function fetchEventTicker(fromDate: moment.Moment, toDate: moment.Moment, historicFetch: boolean, lastFetchedEvents: moment.Moment): Promise<EventTickerResponse> {
  const fromDateString = `${fromDate.format('YYYY-MM-DDTHH:mm:ss.SSSSSS')}Z`
  const toDateString = `${toDate.format('YYYY-MM-DDTHH:mm:ss.SSSSSS')}Z`

  const response = await fetch(
    `/api/platform/ticker?from=${fromDateString}&to=${toDateString}`
  )

  if (response.ok) {
    const data = await response.json()

    const parsed = data
      .filter((event: Event) => {
        return supportedEvents.includes(event.event_type)
      })
      .filter((event: Event) => {
        return !cachedSuccess[event.resource_external_id]
      })
      .map((event: Event) => {
        event.service_name = services[event.gateway_account_id]
        event.timestamp = moment(event.event_date).valueOf()
        event.historic = historicFetch
        event.key = event.resource_external_id + event.timestamp + event.event_type + event.historic

        return event
      })

    const resources = parsed.map((event: Event) => event.resource_external_id)
    // IQ200 - remove duplicated if they are all success events
    const unique = parsed.filter((v: Event, i: number) => !eventsActiveSuccess.includes(v.event_type) || resources.indexOf(v.resource_external_id) === i)

    return {
      historicFetch,
      timeFetched: toDate,
      events: unique
    }
  }
}

export async function fetchServiceInfo() {
  const response = await fetch('/api/platform/services')

  if (response.ok) {
    const data = await response.json()
    services = data
  }
}