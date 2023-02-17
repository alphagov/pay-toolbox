import { NextFunction, Request, Response } from 'express'

import { AdminUsers, Webhooks } from '../../../lib/pay-request/client'

const process = require('process')

const {common} = require('./../../../config')

if (common.development) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const serviceId = req.params.serviceId

    const response = await Webhooks.webhooks.list({
      service_id: serviceId as string
    })

    const service = await AdminUsers.services.retrieve(serviceId as string)

    res.render('webhooks/overview', {
      service,
      webhooks: response.results
    })
  } catch (error) {
    next(error)
  }
}
