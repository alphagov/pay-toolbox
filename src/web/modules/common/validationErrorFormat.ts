/* eslint-disable import/prefer-default-export */
import { ValidationError } from 'class-validator'

export interface ClientFormError {
  id: string;
  message: string;
}

export function formatErrorsForTemplate(
  errors: ValidationError[]
): ClientFormError[] {
  return errors.map((error: ValidationError) => {
    // pick the first constraint reported (should be ordered by importance)
    const selectedConstraintKey = Object.keys(error.constraints)[0]
    const constraint = error.constraints[selectedConstraintKey]
    return {
      id: error.property,
      message: constraint
    }
  })
}
