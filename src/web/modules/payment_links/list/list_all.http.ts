import {NextFunction, Request, Response} from "express";
import {AdminUsers, Connector, Products} from "../../../../lib/pay-request/client";
import {AccountType} from "../../../../lib/pay-request/shared";
import {aggregateServicesByGatewayAccountId} from "../../../../lib/gatewayAccounts";
import _ from "lodash";
import type {Product, ProductStat} from "../../../../lib/pay-request/services/products/types";
import {GatewayAccount} from "../../../../lib/pay-request/services/connector/types";

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
        const paymentLinks = extractLinksFromResponse(productStats, live, liveAccountIds, serviceGatewayAccountIndex)

        const groupedLinks = _.groupBy(paymentLinks, 'product.gateway_account_id')
        const orderedGroups = orderGroups(groupedLinks, sortKey, liveAccountIds)

        const context = {
            filterLiveAccounts: live,
            sort: sortKey,
            groupedPaymentLinks: orderedGroups,
            serviceGatewayAccountIndex
        }

        res.render('payment_links/list/list', context)
    } catch (error) {
        next(error)
    }
}

export function orderGroups (groupedLinks: any, sortKey: string, liveAccountIds: string[]) {
    return _.orderBy(
        Object.keys(groupedLinks)
            .map((key) => {
                const group = groupedLinks[key]
                return {
                    key,
                    links: _.orderBy(group, sortKey, 'desc'),
                    payment_count: _.sumBy(group, 'payment_count'),
                    last_payment_date: _.orderBy(group, 'last_payment_date', 'desc')[0].last_payment_date,
                    is_live_account: liveAccountIds.includes(key)
                }
            }),
        sortKey,
        'desc'
    )
}

export function extractLinksFromResponse (productStatsResponse: ProductStat[], filterLiveAccounts: boolean, liveAccountIds: string[], serviceGatewayAccountIndex: any)  {
    return productStatsResponse
        .filter((productStat) => !filterLiveAccounts || liveAccountIds.includes(`${productStat.product.gateway_account_id}`))
        .map((productStat) => {
            const service = serviceGatewayAccountIndex[productStat.product.gateway_account_id]
            const indexedLinks = getLinksForProductIndexedByType(productStat.product)
            return {
                ...productStat,
                is_live_account: liveAccountIds.includes(`${productStat.product.gateway_account_id}`),
                url: indexedLinks.friendly || indexedLinks.pay,
                service_name: service && service.service_name && service.service_name.en,
                organisation_name: service && service.merchant_details && service.merchant_details.name,
                is_fixed_price: Boolean(productStat.product.price),
                has_metadata: Boolean(productStat.product.metadata)
            }
        })
}

export function getLinksForProductIndexedByType(paymentLink: Product) {
    return paymentLink._links.reduce((aggregate: { [key: string]: string }, linkDetails) => {
        aggregate[linkDetails.rel] = linkDetails.href
        return aggregate
    }, {})
}