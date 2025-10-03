import { ValidationError as ClassValidatorError } from 'class-validator'
import { AxiosError } from 'axios'

export class RequestError extends Error {
  public name: string

  public constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class EntityNotFoundError extends RequestError {
  public data: { name: string; identifier: string }

  public constructor(name: string, identifier: string, description = 'ID') {
    super(`${name} with ${description} ${identifier} was not found.`)
    this.data = { name, identifier }
  }
}

export interface ErrorData {
  errors?: string[]
}

// wrap errors from other frameworks in a format that this service can report on
// @FIXME(sfount) stack trace isn't respected
export class RESTClientError<T = unknown> extends Error {
  public name: string

  public data: AxiosError<T>

  public service: string

  public constructor(error: AxiosError<T>, serviceName: string) {
    super(error.message)
    this.name = this.constructor.name
    this.data = error
    this.service = serviceName
    this.stack = error.stack
  }
}

// expects to be passed a class-validator ValidationError object
export class IOValidationError extends Error {
  public source: ClassValidatorError[]

  public constructor(validations: ClassValidatorError[]) {
    super(validations[0].toString())
    this.source = validations
    Error.captureStackTrace(this, this.constructor)
  }
}

export class ValidationError extends Error {
  public name: string

  public constructor(message: string) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

export class NotImplementedError extends Error {
  public name: string

  public constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}
