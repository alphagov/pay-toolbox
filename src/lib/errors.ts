/* eslint-disable max-classes-per-file */
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

  public constructor(name: string, identifier: string, description: string = 'ID') {
    super(`${name} with ${description} ${identifier} was not found.`)
    this.data = { name, identifier }
  }
}

// wrap errors from other frameworks in a format that this service can report on
// @FIXME(sfount) stack trace isn't respected
export class RESTClientError extends Error {
  public name: string

  public data: AxiosError

  public service: { key: string; name: string }

  public constructor(error: AxiosError, serviceKey: string, serviceName: string) {
    super(error.message)
    this.name = this.constructor.name
    this.data = error
    this.service = { key: serviceKey, name: serviceName }
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
