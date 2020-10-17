import {
  IsNotEmpty,
  IsString
} from 'class-validator'

import Validated from '../common/validated'

class GatewayAccountRequest extends Validated {
  @IsString()
  @IsNotEmpty()
  public id: string;

  public constructor(formValues: { [key: string]: string }) {
    super()
    this.id = formValues.id
    this.validate()
  }
}

export default GatewayAccountRequest
