import React from 'react'

import { Event } from './../../../src/web/modules/transactions/types/ledger'

import { EventCard } from './EventCard'

interface EventListPanelProps {
  events: Event[]
}

export class EventListPanel extends React.Component<EventListPanelProps, {}> {

  render() {
    const events = this.props.events.map((event, index) => {
      return (
        // @FIXME(sfount) duplicated event issues being thrown by React - where is this happening?
        <EventCard key={event.key} event={event} />
      )
    })

    return <div>{events}</div>
  }
}