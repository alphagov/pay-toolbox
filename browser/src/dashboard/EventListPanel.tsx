import React, { Props } from 'react'

import { Event } from 'ledger'

import { EventCard } from './EventCard'


interface EventListPanelProps {
  events: Event[]
}

export class EventListPanel extends React.Component<EventListPanelProps, {}> {

  render() {
    const events = this.props.events.map((event, index) => {
      return (
        <EventCard key={event.resource_external_id + event.timestamp} event={event} />
      )
    }).reverse()

    return <div>{events}</div>
  }
}