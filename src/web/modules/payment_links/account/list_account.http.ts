import {NextFunction, Request, Response} from "express";
import {AdminUsers, Products} from "../../../../lib/pay-request/client";
import {aggregateServicesByGatewayAccountId} from "../../../../lib/gatewayAccounts";
import {extractProductData} from "../list/list_all.http";
import _ from "lodash";

export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const accountId = req.params.accountId
        const sortKey = req.query.sort as string || 'last_payment_date'
        const used = req.query.used !== 'false'

        const [service, productStats] = await Promise.all([
            AdminUsers.services.retrieveByGatewayAccountId(accountId),
            Products.reports.listStats({ gatewayAccountId: Number(accountId), used })
        ])

        const serviceGatewayAccountIndex = aggregateServicesByGatewayAccountId([service])
        const paymentLinks = extractProductData(productStats, false, [], serviceGatewayAccountIndex)
        const orderedPaymentLinks = _.orderBy(paymentLinks, sortKey, 'desc')

        const context = {
            sort: sortKey,
            accountId,
            paymentLinks: orderedPaymentLinks,
            serviceName: service.name,
            used
        }

        res.render('payment_links/account/account', context)
    } catch (error) {
        next(error)
    }
}