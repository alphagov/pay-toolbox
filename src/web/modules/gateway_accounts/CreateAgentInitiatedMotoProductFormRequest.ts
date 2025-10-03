import { MaxLength, IsNotEmpty, IsString } from 'class-validator'
import Validated from '../common/validated'

class CreateAgentInitiatedMotoProductFormRequest extends Validated {
  @IsString()
  @IsNotEmpty({ message: "Enter a payment description" })
  @MaxLength(255, {message: "Payment description must be 255 characters or fewer" })
  public name: string;

  @IsString()
  @MaxLength(255, {message: "Details must be 255 characters or fewer" })
  public description: string;

  @IsString()
  @IsNotEmpty({ message: "Enter a name of reference" })
  @MaxLength(50, {message: "Reference label must be 50 characters or fewer" })
  public reference_label: string;

  @IsString()
  @MaxLength(255, {message: "Reference hint text must be 255 characters or fewer" })
  public reference_hint: string;

  public constructor(formValues: Record<string, string>) {
    super()
    this.name = formValues.name
    this.description = formValues.description
    this.reference_label = formValues.reference_label
    this.reference_hint = formValues.reference_hint
    this.validate()
  }
}

export default CreateAgentInitiatedMotoProductFormRequest
