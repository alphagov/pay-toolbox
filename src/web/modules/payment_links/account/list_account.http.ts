import {NextFunction, Request, Response} from "express";
import {AdminUsers, Products} from "../../../../lib/pay-request/client";
import {aggregateServicesByGatewayAccountId} from "../../../../lib/gatewayAccounts";
import {extractLinksFromResponse} from "../list/list_all.http";

export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const accountId = Number(req.params.accountId)
        const sortKey = req.query.sort as string || 'last_payment_date'
        const used = req.query.used !== 'false'

        const [service, productStats] = await Promise.all([
            AdminUsers.services.retrieve({ gatewayAccountId: accountId }),
            Products.reports.listStats({ gatewayAccountId: accountId, used })
        ])

        const serviceGatewayAccountIndex = aggregateServicesByGatewayAccountId([service])
        const paymentLinks = extractLinksFromResponse(productStats, false, [], serviceGatewayAccountIndex)

        const context = {
            sort: sortKey,
            accountId,
            paymentLinks,
            serviceName: service.name,
            used
        }

        res.render('payment_links/account/account', context)
    } catch (error) {
        next(error)
    }
}