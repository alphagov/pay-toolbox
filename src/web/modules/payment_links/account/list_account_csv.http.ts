import {NextFunction, Request, Response} from "express";
import {extractLinksFromResponse, orderGroups} from "../list/list_all.http";
import {format} from "../csv";
import {AdminUsers, Products} from "../../../../lib/pay-request/client";
import {aggregateServicesByGatewayAccountId} from "../../../../lib/gatewayAccounts";

export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const accountId = req.params.accountId
        const sortKey = req.query.sort as string || 'last_payment_date'
        const used = req.query.used !== 'false'

        const [service, productStats] = await Promise.all([
            AdminUsers.services.retrieve({ gatewayAccountId: accountId }),
            Products.reports.listStats({ gatewayAccountId: Number(accountId), used })
        ])

        const serviceGatewayAccountIndex = aggregateServicesByGatewayAccountId([service])
        const paymentLinks = extractLinksFromResponse(productStats, false, [], serviceGatewayAccountIndex)

        const name = accountId
        res.set('Content-Type', 'text/csv')
        res.set('Content-Disposition', `attachment; filename="GOVUK_Pay_payment_links_usage_${name}.csv"`)
        res.status(200).send(format(paymentLinks))
    } catch (error) {
        next(error)
    }
}