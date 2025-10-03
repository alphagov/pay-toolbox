import { Request, Response, NextFunction } from 'express'

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

type HandlerMap = Record<string, Handler>;

// async error handling wrapper, simple util to remove top level try ... catch
// boilerplate if the route doesn't need to use any handling behaviour
const route = function route(method: Handler): Handler {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    Promise.resolve(method(req, res, next)).catch((error) => {
      next(error)
    })
  }
}

const wrapAsyncErrorHandlers = function wrapAsyncErrorHandlers(handlers: HandlerMap): HandlerMap {
  return Object.keys(handlers).reduce((aggregate: HandlerMap, handlerKey) => {
     
    aggregate[handlerKey] = route(handlers[handlerKey])
    return aggregate
  }, {})
}

const wrapAsyncErrorHandler = function wrapAsyncErrorHandler(handler: Handler): Handler {
  return route(handler)
}

export { wrapAsyncErrorHandlers, wrapAsyncErrorHandler }
