import { ValidationError as ClassValidatorError } from 'class-validator'
import { AxiosError } from 'axios'

class RequestError extends Error {
  public name: string

  public constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

class EntityNotFoundError extends RequestError {
  public data: { name: string; identifier: string }

  public constructor(name: string, identifier: string) {
    super(`${name} with ID ${identifier} was not found.`)
    this.data = { name, identifier }
  }
}

// wrap errors from other frameworks in a format that this service can report on
// @FIXME(sfount) stack trace isn't respected
class RESTClientError extends Error {
  public name: string

  public data: AxiosError

  public service: { key: string; name: string }

  public constructor(error: AxiosError, serviceKey: string, serviceName: string) {
    super(error.message)
    this.name = this.constructor.name
    this.data = error
    this.service = { key: serviceKey, name: serviceName }
    Error.captureStackTrace(this, this.constructor)
  }
}

// expects to be passed a class-validator ValidationError object
class IOValidationError extends Error {
  public source: ClassValidatorError[]

  public constructor(validations: ClassValidatorError[]) {
    super(validations[0].toString())
    this.source = validations
    Error.captureStackTrace(this, this.constructor)
  }
}

class ValidationError extends Error {
  public name: string

  public constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export {
  EntityNotFoundError, RESTClientError, ValidationError, IOValidationError
}
