import {NextFunction, Request, Response} from 'express'
import {Connector} from "../../../lib/pay-request/client";
import crypto from "crypto";

const NotifyClient = require('notifications-node-client').NotifyClient

export async function tempCheckNotifyServiceId(req: Request, res: Response, next: NextFunction) {
    try {
        const {accountId} = req.params
        const account = await Connector.accounts.retrieve(accountId)
        if (!account.notifySettings) {
            res.send("No email custom branding configured for gateway account")
        }

        const templateId = account.notifySettings.template_id
        const serviceId = account.notifySettings.service_id
        const apiKey = account.notifySettings.api_token

        const notifyClient = new NotifyClient(apiKey)
        const response = await notifyClient
            .sendEmail(templateId, 'simulate-delivered@notifications.service.gov.uk', {
                personalisation: {
                    'serviceReference': 'TEST',
                    'date': 'TEST',
                    'amount': 'TEST',
                    'description': 'TEST',
                    'customParagraph': 'TEST',
                    'serviceName': 'TEST',
                    'corporateCardSurcharge': 'TEST'
                },
                reference: crypto.randomUUID()
            })
        const templateUri = response.data.template.uri
        const regex = /services\/(\S+)\/templates/g
        const serviceIdFromTemplate = regex.exec(templateUri)[1]
        if (serviceId === serviceIdFromTemplate) {
            res.send('Service ID correct')
        } else {
            res.send('Service ID does not match - should be ' + serviceIdFromTemplate)
        }
    } catch (err) {
        next(err)
    }
}
