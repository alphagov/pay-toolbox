import { validateSync, ValidationError } from 'class-validator'
import { IOValidationError } from '../../../lib/errors'

abstract class Validated {
  public validate(): void {
    // ensure that information passed from HTML form is correct
    const errors: ValidationError[] = validateSync(this)
    if (errors.length) throw new IOValidationError(errors)
  }
}

export default Validated
