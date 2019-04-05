import {
  IsNotEmpty,
  IsNumber
} from 'class-validator'

import Validated from '../common/validated'

class GatewayAccountRequest extends Validated {
  @IsNumber()
  @IsNotEmpty()
  public id: number;

  public constructor(formValues: { [key: string]: string }) {
    super()
    this.id = Number(formValues.id)
    this.validate()
  }
}

export default GatewayAccountRequest
