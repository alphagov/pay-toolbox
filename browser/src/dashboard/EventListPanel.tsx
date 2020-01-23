import React, { Props } from 'react'

import { Event } from 'ledger'

import { EventCard } from './EventCard'

interface EventListPanelProps {
  events: Event[]
}

export class EventListPanel extends React.Component<EventListPanelProps, {}> {

  render() {
    // @FIXME(sfount) temporarily checking why we would have multiple instances of events shown here
    const counts = this.props.events.reduce((aggregate: any, event: Event) => {
        aggregate[event.key] = aggregate[event.key] ? aggregate[event.key] + 1 : 1
        return aggregate
      },{})
    Object.keys(counts).forEach((key) => {
      if(counts[key] > 1) {
        console.log('Multiple instances of event key found for key:', key)
        console.log('List of all events', this.props.events)
      }
    })

    const events = this.props.events.map((event, index) => {
      return (
        // @FIXME(sfount) duplicated event issues being thrown by React - where is this happening?
        <EventCard key={event.key} event={event} />
      )
    })

    return <div>{events}</div>
  }
}