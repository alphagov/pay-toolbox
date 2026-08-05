import { NextFunction, Request, Response } from 'express'
import { AdminUsers } from "../../../../lib/pay-request/client";


export async function updateFeature(req: Request, res: Response, next: NextFunction): Promise<void> {

  try {
    const featureName = req.params.feature
    const service = await AdminUsers.services.retrieve(req.params.id)
    const { name: serviceName, external_id: id } = service
    const enabled = service.service_features[featureName].enabled

    res.render('services/features/update', { serviceName, id, featureName, enabled, csrf: req.csrfToken() })
  }
  catch (error) {
    next(error)
  }
}

export async function updateFeatureForm(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const featureName = req.params.feature
    const service = await AdminUsers.services.retrieve(req.params.id)

    const targetState = req.body.enabled

    await AdminUsers.services.updateFeature(service.external_id, featureName, targetState)
    req.flash('info', `Feature ${featureName} was ${targetState} for service ${service.name}`)
    res.redirect(`/services/${service.external_id}`)
  }
  catch (error) {
    next(error)
  }
}