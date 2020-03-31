import _ from 'lodash'
import { Request, Response, NextFunction } from 'express'
import { Products, AdminUsers } from '../../../lib/pay-request'

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
    let serviceRequest, paymentLinksRequest
    const { accountId } = req.params
    const sort = req.query.sort || 'last_payment_date'

    if (accountId) {
      serviceRequest = AdminUsers.gatewayAccountServices(accountId)
        .then((service: any) => [ service ])
    } else {
      serviceRequest = AdminUsers.services()
    }
    paymentLinksRequest = Products.paymentLinksWithUsage(accountId)

    const [serviceResponse, paymentLinksResponse] = await Promise.all([serviceRequest, paymentLinksRequest])

    const serviceGatewayAccountIndex = serviceResponse
      .reduce((aggregate: any, service: any) => {
        service.gateway_account_ids.forEach((accountId: string) => {
          aggregate[accountId] = service.service_name && service.service_name.en
        })
        return aggregate
      }, {})

    const paymentLinks = paymentLinksResponse.map(indexPaymentLinksByType)
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
      groupedPaymentLinks: orderedGroups, accountId, serviceGatewayAccountIndex, sort
    })
  } catch (error) {
    next(error)
  }
}