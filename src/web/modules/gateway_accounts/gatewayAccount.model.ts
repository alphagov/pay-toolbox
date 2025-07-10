import {
  IsNotEmpty,
  IsIn,
  IsString,
  IsBoolean
} from 'class-validator'

import Validated from '../common/validated'
import {ValidationError} from '../../../lib/errors'
import {CreateGatewayAccountRequest} from '../../../lib/pay-request/services/connector/types'
import {AccountType} from '../../../lib/pay-request/shared'
import {liveStatus} from "../../../lib/liveStatus";
import {providers} from "../../../lib/providers";

class GatewayAccount extends Validated {
  @IsIn(Object.values(liveStatus))
  @IsNotEmpty()
  public live: string;

  @IsString()
  @IsNotEmpty({message: 'Please enter a description'})
  public description: string;

  @IsString()
  @IsNotEmpty({message: 'Please enter a service name'})
  public serviceName: string;

  @IsIn([...Object.values(providers)])
  @IsString()
  @IsNotEmpty()
  public provider: string;

  public credentials: string;

  @IsString()
  @IsNotEmpty({message: 'Please select a sector'})
  public sector: string;

  public internalFlag: boolean;

  public serviceId: string;

  @IsBoolean()
  @IsNotEmpty()
  public sendPayerEmailToGateway: boolean;

  @IsBoolean()
  @IsNotEmpty()
  public sendPayerIpAddressToGateway: boolean;

  public validate(): void {
    super.validate()

    if (this.isLive() && this.provider === providers.sandbox) {
      throw new ValidationError('Live accounts cannot have Sandbox provider')
    }

    if (this.provider === providers.stripe && !this.credentials.trim()) {
      throw new ValidationError('Stripe credentials are required')
    }
  }

  public constructor(formValues: { [key: string]: string }) {
    super()
    this.live = formValues.live
    this.description = formValues.description
    this.serviceName = formValues.serviceName
    this.provider = formValues.provider
    this.credentials = formValues.credentials
    this.sector = formValues.sector
    this.internalFlag = formValues.internalFlag === "true"
    this.sendPayerEmailToGateway = true
    this.sendPayerIpAddressToGateway = true
    this.validate()
  }

  // formats gateway account according to the Connector patch standard
  public formatPayload(): CreateGatewayAccountRequest {
    const payload: CreateGatewayAccountRequest = {
      payment_provider: this.provider,
      description: this.description,
      type: this.isLive() ? AccountType.Live : AccountType.Test,
      service_name: this.serviceName,
      service_id: this.serviceId,
      send_payer_email_to_gateway: this.sendPayerEmailToGateway,
      send_payer_ip_address_to_gateway: this.sendPayerEmailToGateway,
    }

    if (this.isLive() || this.provider === 'stripe' || this.provider === 'worldpay') {
      payload.requires_3ds = true
    } else {
      payload.requires_3ds = false
    }

    if (this.provider === 'worldpay' || this.provider === 'stripe') {
      payload.allow_apple_pay = true
    }

    if (this.provider === 'stripe') {
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
