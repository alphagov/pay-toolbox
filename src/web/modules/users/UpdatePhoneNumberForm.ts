import { IsPhoneNumber, IsNotEmpty, IsString } from 'class-validator'

import Validated from '../common/validated'

class UpdatePhoneNumberFormRequest extends Validated {
  @IsPhoneNumber(null, { message: 'User telephone number must be a valid international phone number' })
  @IsNotEmpty()
  @IsString()
  public telephone_number: string;

  public constructor(formValues: {[key: string]: string}) {
    super()
    this.telephone_number = formValues.telephone_number
    this.validate()
  }
}

export default UpdatePhoneNumberFormRequest
