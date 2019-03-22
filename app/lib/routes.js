// async error handling wrapper, simple util to remove top level try ... catch
// boilerplate if the route doesn't need to use any handling behaviour
const route = method => async (req, res, next) => {
  Promise.resolve(method(req, res, next)).catch((error) => {
    next(error)
  })
}

const wrapAsyncErrorHandlers = function wrapAsyncErrorHandlers(handlers) {
  return Object.keys(handlers).reduce((aggregate, handlerKey) => {
    aggregate[handlerKey] = route(handlers[handlerKey])
    return aggregate
  }, {})
}

module.exports = { wrapAsyncErrorHandlers }
