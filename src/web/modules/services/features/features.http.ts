import {NextFunction, Request, Response} from 'express'
import {AdminUsers} from "../../../../lib/pay-request/client";


export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {

    try {
        const featureName = req.params.feature

        const service = await AdminUsers.services.retrieve(req.params.id)
        const {name : serviceName, external_id: id} = service

        res.render('services/features/update', { serviceName, id, featureName })
    }
    catch (error){
        next(error)
    }


}