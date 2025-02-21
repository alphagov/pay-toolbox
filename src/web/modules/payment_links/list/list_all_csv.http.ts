import {NextFunction, Request, Response} from "express";
import {format} from "../csv";
import {
    extractProductData,
    groupByGatewayAccountId,
    orderGroupsBySortKey,
} from './list_all.http'
import {AdminUsers, Connector, Products} from "../../../../lib/pay-request/client";
import {AccountType} from "../../../../lib/pay-request/shared";
import {GatewayAccount} from "../../../../lib/pay-request/services/connector/types";
import {aggregateServicesByGatewayAccountId} from "../../../../lib/gatewayAccounts";

export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const sortKey = req.query.sort as string || 'last_payment_date'
        const live = req.query.live === undefined ? true : req.query.live && req.query.live !== "false"

        const [services, liveAccountIds, productStats] = await Promise.all([
            AdminUsers.services.list(),
            Connector.accounts.list({type: AccountType.Live})
                .then((response) => response.accounts)
                .then(accounts => accounts.map((account: GatewayAccount) => account.gateway_account_id)),
            Products.reports.listStats()
        ])
        const serviceGatewayAccountIndex = aggregateServicesByGatewayAccountId(services)
        const paymentLinks = extractProductData(productStats, live, liveAccountIds, serviceGatewayAccountIndex)
        const paymentLinksGroupedByGatewayAccountId = groupByGatewayAccountId(paymentLinks)
        const orderedPaymentLinkGroups = orderGroupsBySortKey(paymentLinksGroupedByGatewayAccountId, sortKey, liveAccountIds)

        const flatLinksList = orderedPaymentLinkGroups
            .reduce((aggregate, groupedList) => {
                aggregate = [...aggregate, ...groupedList.links]
                return aggregate
            }, [])

        const name = 'platform'
        res.set('Content-Type', 'text/csv')
        res.set('Content-Disposition', `attachment; filename="GOVUK_Pay_payment_links_usage_${name}.csv"`)
        res.status(200).send(format(flatLinksList))
    } catch (error) {
        next(error)
    }
}