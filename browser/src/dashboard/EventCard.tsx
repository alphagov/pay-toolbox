import React from 'react'

import { Event } from './../../../src/web/modules/transactions/types/ledger'

import VisaIcon from './../assets/card_visa.svg'
import MastercardIcon from './../assets/card_mastercard.svg'
import AmexIcon from './../assets/card_amex.svg'
import UnknownIcon from './../assets/card_unknown.svg'

import WorldpayLogo from './../assets/psp_worldpay.jpg'
import StripeLogo from './../assets/psp_stripe.jpg'
import BarclaysLogo from './../assets/psp_barclays.jpg'
import SandboxLogo from './../assets/psp_sandbox.png'

import StatusFailureIcon from './../assets/status_failure.svg'
import StatusSuccessIcon from './../assets/status_success.svg'

import { CardImage, CardIcon } from './EventCardIcon'

import { OpacitySpring } from './Spring'

import { eventsActiveSuccess, eventsErrored } from './events'

import { currencyFormatter } from './format'

interface CardProfile {
  backgroundColour: string,
  colour: string
}

const SuccessProfile: CardProfile = {
  backgroundColour: '#00703c',
  colour: '#ffffff'
}

const FailureProfile: CardProfile = {
  backgroundColour: '#d4351c',
  colour: '#ffffff'
}

const DefaultProfile: CardProfile = {
  backgroundColour: '#ffffff',
  colour: '#000000'
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
  'smartpay': BarclaysLogo,
  'sandbox': SandboxLogo
}

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

interface EventCardProps {
  event: Event,
  showAllEvents: boolean
}

export class EventCard extends React.Component<EventCardProps, {}> {
  render() {
    const profile = this.props.showAllEvents ? (profileMap[this.props.event.event_type] || DefaultProfile) : DefaultProfile
    const paymentTypeIcon = paymentTypeMap[this.props.event.card_brand] || UnknownIcon
    const paymentProviderIcon = providerLogoMap[this.props.event.payment_provider]

    let statusIcon: string

    if (!this.props.showAllEvents) {
      statusIcon = paymentTypeIcon
    } else if (this.props.event.event_type === 'PAYMENT_DETAILS_ENTERED') {
      statusIcon = paymentTypeIcon
    } else if (eventsActiveSuccess.includes(this.props.event.event_type)) {
      statusIcon = StatusSuccessIcon
    } else {
      statusIcon = StatusFailureIcon
    }

    let icon: JSX.Element
    let recentTag: JSX.Element

    if (this.props.event.event_type === 'PAYMENT_CREATED') {
      icon = <CardImage image={paymentProviderIcon} />
    } else {
      icon = <CardIcon icon={statusIcon} />
    }
    if (this.props.event.is_recent) {
      recentTag = <div style={{ textAlign: 'left', marginBottom: '8px', marginLeft: '8px', marginTop: '16px' }}><span className="govuk-tag govuk-tag--blue">new service</span></div>
    }
    return (
      <div>
        <OpacitySpring>
          { recentTag }
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
      </div>
    )
  }
}