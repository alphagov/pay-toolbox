// @TODO(sfount) move error definitions outside of index file
class RequestError extends Error {
  constructor (message) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

class EntityNotFoundError extends RequestError {
  constructor (name, identifier) {
    super(`${name} with ID ${identifier} was not found.`)
    this.data = { name, identifier }
  }
}

// wrap errors from other frameworks in a format that this service can report on
// @FIXME(sfount) stack trace isn't respected
class RESTClientError extends Error {
  constructor (error, key, name) {
    super(error.message)
    this.name = this.constructor.name
    this.data = error
    this.service = { key, name }
    Error.captureStackTrace(this, this.constructor)
  }
}

class ValidationError extends Error {
  constructor (message) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = { EntityNotFoundError, RESTClientError, ValidationError }
