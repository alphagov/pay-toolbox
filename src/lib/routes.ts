import { Request, Response, NextFunction } from 'express'

interface Handler {
  (req: Request, res: Response, next: NextFunction): Promise<void>;
}

interface HandlerMap {
  [key: string]: Handler;
}

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
    // eslint-disable-next-line no-param-reassign
    aggregate[handlerKey] = route(handlers[handlerKey])
    return aggregate
  }, {})
}

const wrapAsyncErrorHandler = function wrapAsyncErrorHandler(handler: Handler): Handler {
  return route(handler)
}

// eslint-disable-next-line import/prefer-default-export
export { wrapAsyncErrorHandlers, wrapAsyncErrorHandler }
