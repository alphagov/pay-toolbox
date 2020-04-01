import _ from 'lodash'
import { Request, Response, NextFunction } from 'express'
import { Products, AdminUsers, Connector } from '../../../lib/pay-request'

function indexPaymentLinksByType(paymentLink: any): any {
  const index = paymentLink.product._links.reduce((aggregate: any, linkDetails: any) => {
    aggregate[linkDetails.rel] = linkDetails.href
    return aggregate
  }, {})
  paymentLink.product._indexedLinks = index
  return paymentLink
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let serviceRequest, paymentLinksRequest, liveAccountsRequest
    const { accountId } = req.params
    const sort = req.query.sort || 'last_payment_date'
    const live = req.query.live === undefined ? true : req.query.live && req.query.live !== "false"

    // we're only going to filter live gateway accounts if we're at the whole platform level
    const filterLiveAccounts = live && !accountId

    if (accountId) {
      serviceRequest = AdminUsers.gatewayAccountServices(accountId)
        .then((service: any) => [ service ])
    } else {
      serviceRequest = AdminUsers.services()
    }

    if (filterLiveAccounts) {
      liveAccountsRequest = Connector.accounts({ type: 'live' })
        .then((response: any) => response.accounts)
    } else {
      liveAccountsRequest = Promise.resolve([])
    }

    paymentLinksRequest = Products.paymentLinksWithUsage(accountId)

    const [serviceResponse, paymentLinksResponse, liveAccountsResponse] = await Promise.all([serviceRequest, paymentLinksRequest, liveAccountsRequest])

    const serviceGatewayAccountIndex = serviceResponse
      .reduce((aggregate: any, service: any) => {
        service.gateway_account_ids.forEach((accountId: string) => {
          aggregate[accountId] = service.service_name && service.service_name.en
        })
        return aggregate
      }, {})

    const liveAccounts = liveAccountsResponse.map((account: any) => account.gateway_account_id)

    const paymentLinks = paymentLinksResponse
      .map(indexPaymentLinksByType)
      .filter((link: any) => !filterLiveAccounts || liveAccounts.includes(link.product.gateway_account_id))

    const groupedLinks = _.groupBy(paymentLinks, 'product.gateway_account_id')
    const orderedGroups = _.orderBy(
      Object.keys(groupedLinks)
        .map((key: any) => {
          const group = groupedLinks[key]
          return {
            key,
            links: _.orderBy(group, sort, 'desc'),
            payment_count: _.sumBy(group, 'payment_count'),
            last_payment_date: _.orderBy(group, 'last_payment_date', 'desc')[0].last_payment_date
          }
        }),
      sort,
      'desc'
    )

    res.render('payment_links/overview', {
      groupedPaymentLinks: orderedGroups, accountId, serviceGatewayAccountIndex, sort, filterLiveAccounts
    })
  } catch (error) {
    next(error)
  }
}