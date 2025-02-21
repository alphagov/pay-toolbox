import {NextFunction, Request, Response} from "express";
import {AdminUsers, Connector, Products} from "../../../../lib/pay-request/client";
import {AccountType} from "../../../../lib/pay-request/shared";
import {aggregateServicesByGatewayAccountId} from "../../../../lib/gatewayAccounts";
import {Product, ProductLink, ProductStat, Rel} from "../../../../lib/pay-request/services/products/types";
import {GatewayAccount} from "../../../../lib/pay-request/services/connector/types";
import {Service} from "../../../../lib/pay-request/services/admin_users/types";
import _ from "lodash";

export async function get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const sortKey = req.query.sort as string || 'last_payment_date'
        const live = req.query.live === undefined ? true : req.query.live && req.query.live !== "false"

        const [services, liveAccountIds, productStats] = await Promise.all([
            AdminUsers.services.list(),
            // since products doesn't have the account type, the only way to get all links for only live accounts
            // is to get a list of all the live account IDs from connector and compare against that
            Connector.accounts.list({type: AccountType.Live})
                .then((response) => response.accounts)
                .then(accounts => accounts.map((account: GatewayAccount) => account.gateway_account_id)),
            Products.reports.listStats()
        ])

        const servicesByGatewayAccountId = aggregateServicesByGatewayAccountId(services)
        const paymentLinks = extractProductData(productStats, live, liveAccountIds, servicesByGatewayAccountId)

        const paymentLinksGroupedByGatewayAccountId = groupByGatewayAccountId(paymentLinks)
        const orderedPaymentLinkGroups = orderGroupsBySortKey(paymentLinksGroupedByGatewayAccountId, sortKey, liveAccountIds)

        const context = {
            filterLiveAccounts: live,
            sort: sortKey,
            groupedPaymentLinks: orderedPaymentLinkGroups
        }

        res.render('payment_links/list/list', context)
    } catch (error) {
        next(error)
    }
}

export function groupByGatewayAccountId (paymentLinks: ProductData[]): Map<string, ProductData[]> {
    return paymentLinks.reduce((accumulator : Map<string, ProductData[]>, current) => {
        if (accumulator.has(current.gateway_account_id)) {
            const group = accumulator.get(current.gateway_account_id)
            group.push(current)
            accumulator.set(current.gateway_account_id, group)
        } else {
            accumulator.set(current.gateway_account_id, [current])
        }
        return accumulator
    }, new Map())
}

export function orderGroupsBySortKey (groupedLinks: Map<string, ProductData[]>, sortKey: string, liveAccountIds: string[]) : ProductDataGroup[] {
    const groupsWithSortKeys = Array.from(groupedLinks.keys())
        .map((gateway_account_id) => {
            const group = groupedLinks.get(gateway_account_id)
            return {
                gateway_account_id,
                links: _.orderBy(group, sortKey, 'desc'),
                payment_count: _.sumBy(group, 'payment_count'),
                last_payment_date: _.orderBy(group, 'last_payment_date', 'desc')[0].last_payment_date,
                is_live_account: liveAccountIds.includes(gateway_account_id),
                service_name: group[0].service_name
            }
        })
    return _.orderBy(groupsWithSortKeys, sortKey, 'desc')
}


export function extractProductData (productStats: ProductStat[], filterLiveAccounts: boolean, liveAccountIds: string[], servicesByGatewayAccountId: Map<string, Service>) : ProductData[]  {
    return productStats
        .filter((productStat) => !filterLiveAccounts || liveAccountIds.includes(`${productStat.product.gateway_account_id}`))
        .map((productStat) => {
            const service = servicesByGatewayAccountId.get(`${productStat.product.gateway_account_id}`)
            return {
                ...productStat,
                gateway_account_id: `${productStat.product.gateway_account_id}`,
                is_live_account: liveAccountIds.includes(`${productStat.product.gateway_account_id}`),
                url: extractFriendlyLink(productStat.product._links),
                service_name: service?.name,
                is_fixed_price: Boolean(productStat.product.price),
                has_metadata: Boolean(productStat.product.metadata)
            }
        })
}

export function extractFriendlyLink(productLinks: ProductLink[]) : string {
    return (productLinks.filter(link => link.rel === Rel.Friendly)[0] || productLinks.filter(link => link.rel === Rel.Pay)[0]).href
}

interface ProductData {
    product: Product;
    gateway_account_id: string;
    payment_count: number;
    last_payment_date: string;
    is_live_account: boolean;
    url: string;
    service_name: string;
    is_fixed_price: boolean;
    has_metadata: boolean;
}

interface ProductDataGroup {
    gateway_account_id: string;
    links: ProductData[];
    payment_count: number;
    last_payment_date: string;
    is_live_account: boolean;
    service_name: string;
}