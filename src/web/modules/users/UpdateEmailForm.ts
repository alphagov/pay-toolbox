import { IsEmail, IsNotEmpty, IsString } from 'class-validator'

import Validated from '../common/validated'

class UpdateEmailFormRequest extends Validated {
  @IsEmail({}, { message: 'Provided value must be a valid email' })
  @IsNotEmpty()
  @IsString()
  public email: string;

  public constructor(formValues: {[key: string]: string}) {
    super()
    this.email = formValues.email
    this.validate()
  }
}

export default UpdateEmailFormRequest
