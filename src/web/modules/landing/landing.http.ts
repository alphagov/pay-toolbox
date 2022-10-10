import {NextFunction, Request, Response} from 'express'
import {healthCheck} from "./services";

export async function root(req: Request, res: Response, next: NextFunction) {
  try {
    const serviceStatuses = await healthCheck()
    res.render('landing/landing', {serviceStatuses})
  } catch (err) {
    next(err)
  }
}
