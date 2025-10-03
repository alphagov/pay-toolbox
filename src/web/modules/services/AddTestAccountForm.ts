import {IsBoolean, IsEmail, IsNotEmpty, IsString} from 'class-validator'

import Validated from '../common/validated'

export default class AddTestAccountFormRequest extends Validated {
  @IsNotEmpty()
  @IsString()
  public provider: string;

  public constructor(formValues: Record<string, string>) {
    super()
    this.provider = formValues.provider
    this.validate()
  }
}
