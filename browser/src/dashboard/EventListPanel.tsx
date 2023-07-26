import React from 'react'

import { Event } from './../../../src/web/modules/transactions/types/ledger'
import { AggregateSyncStatus } from './Dashboard'

import { EventCard } from './EventCard'

interface EventListPanelProps {
  sync: AggregateSyncStatus,
  numberOfAggregateSyncs: number,
  events: Event[],
  fetchedServices: boolean,
  isFetching: boolean,
  showAllEvents: boolean
}

function LoadingCard(props: any): JSX.Element {
  return <div style={{ backgroundColor: '#f3f2f1', padding: '10px', textAlign: 'center', borderRadius: '3px', marginBottom: '10px', border: '1px solid #b1b4b6' }}>
      <span style={{ marginRight: '5px' }}>{ props.children }</span>
      <div className="loader"></div>
    </div>
}

export class EventListPanel extends React.Component<EventListPanelProps, {}> {
  render() {
    let syncStatus
    const events = this.props.events.map((event, index) => <EventCard key={event.key} event={event} showAllEvents={this.props.showAllEvents} />)
    
    if(this.props.sync && this.props.sync.pending && this.props.numberOfAggregateSyncs <= 1) {
      syncStatus = <LoadingCard>Sync</LoadingCard>
    } else if (!this.props.fetchedServices && this.props.isFetching) {
      syncStatus = <LoadingCard>Getting service data</LoadingCard>
    } else {
      syncStatus = ''
    }

    return <div>
      {syncStatus}
      {events}
      </div>
  }
}