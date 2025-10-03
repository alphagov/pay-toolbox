import { MaxLength, IsNotEmpty, IsString } from 'class-validator'

import Validated from '../common/validated'

class UpdateOrganisationFormRequest extends Validated {
  @MaxLength(255, {message: "Provided value must be less than 256 characters" })
  @IsNotEmpty()
  @IsString()
  public name: string;

  public constructor(formValues: Record<string, string>) {
    super()
    this.name = formValues.name
    this.validate()
  }
}

export default UpdateOrganisationFormRequest
