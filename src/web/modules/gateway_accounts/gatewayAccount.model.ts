import {
  IsNotEmpty,
  IsIn,
  IsString
} from 'class-validator'

import Validated from '../common/validated'
import {ValidationError} from '../../../lib/errors'
import {CreateGatewayAccountRequest} from '../../../lib/pay-request/services/connector/types'
import {AccountType} from '../../../lib/pay-request/shared'

const liveStatus = {
  live: 'live',
  notLive: 'not-live'
}

const sandbox = {
  card: 'card-sandbox'
}

const cardProviders = {
  sandbox: sandbox.card,
  worldpay: 'worldpay',
  smartpay: 'smartpay',
  epdq: 'epdq',
  stripe: 'stripe'
}

const paymentMethod = {
  card: 'card'
}

class GatewayAccount extends Validated {
  @IsIn(Object.values(liveStatus))
  @IsNotEmpty()
  public live: string;

  @IsIn(Object.values(paymentMethod))
  @IsString()
  @IsNotEmpty()
  public paymentMethod: string;

  @IsString()
  @IsNotEmpty({message: 'Please enter a description'})
  public description: string;

  @IsString()
  @IsNotEmpty({message: 'Please enter a service name'})
  public serviceName: string;

  @IsIn([...Object.values(cardProviders)])
  @IsString()
  @IsNotEmpty()
  public provider: string;

  public credentials: string;

  @IsString()
  @IsNotEmpty({message: 'Please select a sector'})
  public sector: string;

  public internalFlag: boolean;

  public serviceId: string;

  public validate(): void {
    super.validate()

    if (this.paymentMethod === paymentMethod.card
      && !Object.values(cardProviders).includes(this.provider)) {
      throw new ValidationError(`For Card accounts, provider must be one of ${Object.values(cardProviders)}`)
    }

    if (this.live === liveStatus.live && Object.values(sandbox).includes(this.provider)) {
      throw new ValidationError('Live accounts cannot have Sandbox provider')
    }

    if (this.provider === cardProviders.stripe && !this.credentials.trim()) {
      throw new ValidationError('Stripe credentials are required')
    }
  }

  public constructor(formValues: { [key: string]: string }) {
    super()
    this.live = formValues.live
    this.paymentMethod = formValues.paymentMethod
    this.description = formValues.description
    this.serviceName = formValues.serviceName
    this.provider = formValues.provider
    this.credentials = formValues.credentials
    this.sector = formValues.sector
    this.internalFlag = formValues.internalFlag === "true"
    this.validate()
  }

  // formats gateway account according to the Connector patch standard
  public formatPayload(): CreateGatewayAccountRequest {
    if (Object.values(sandbox).includes(this.provider)) this.provider = 'sandbox'

    const payload: CreateGatewayAccountRequest = {
      payment_provider: this.provider,
      description: this.description,
      type: this.isLive() ? AccountType.Live : AccountType.Test,
      service_name: this.serviceName,
      service_id: this.serviceId
    }

    if (this.isLive() || this.provider === 'stripe' || this.provider === 'worldpay') {
      payload.requires_3ds = true
    } else {
      payload.requires_3ds = false
    }

    if (this.provider === 'stripe') {
      payload.allow_apple_pay = true
      payload.allow_google_pay = true
      if (this.credentials) {
        payload.credentials = {
          stripe_account_id: this.credentials
        }
      }
    }

    if (!this.serviceId) {
      throw new Error('Service ID must be set for gateway account request')
    }
    return payload
  }

  public isLive(): boolean {
    return this.live === liveStatus.live
  }
}

export default GatewayAccount
