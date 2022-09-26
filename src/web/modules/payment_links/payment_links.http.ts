import _ from 'lodash'
import { Request, Response, NextFunction } from 'express'
import { Products, AdminUsers, Connector } from '../../../lib/pay-request'
import { aggregateServicesByGatewayAccountId } from '../../../lib/gatewayAccounts'
import { format } from './csv'

function indexPaymentLinkByType(paymentLink: any): any {
  const index = paymentLink._links.reduce((aggregate: any, linkDetails: any) => {
    aggregate[linkDetails.rel] = linkDetails.href
    return aggregate
  }, {})
  paymentLink._indexedLinks = index
  return paymentLink
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { accountId } = req.params
    const sort = req.query.sort as string || 'last_payment_date'
    const live = req.query.live === undefined ? true : req.query.live && req.query.live !== "false"

    // we're only going to filter live gateway accounts if we're at the whole platform level
    const filterLiveAccounts = live && !accountId
    const usageReportResults = await fetchUsageContext(sort, filterLiveAccounts, accountId)

    const context = {
      filterLiveAccounts,
      sort,
      accountId,
      ...usageReportResults
    }

    res.render('payment_links/overview', context)
  } catch (error) {
    next(error)
  }
}

export async function listCSV(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { accountId } = req.params
    const sort = req.query.sort as string || 'last_payment_date'
    const live = req.query.live === undefined ? true : req.query.live && req.query.live !== "false"
    const filterLiveAccounts = live && !accountId
    const usageReportResults = await fetchUsageContext(sort, filterLiveAccounts, accountId)
    const flatLinksList = usageReportResults.groupedPaymentLinks
      .reduce((aggregate: any, groupedList: any) => {
        aggregate = [...aggregate, ...groupedList.links]
        return aggregate
      }, [])

    const name = accountId || 'platform'
    res.set('Content-Type', 'text/csv')
    res.set('Content-Disposition', `attachment; filename="GOVUK_Pay_payment_links_usage_${name}.csv"`)
    res.status(200).send(format(flatLinksList))
  } catch (error) {
    next(error)
  }
}

export function search(req: Request, res: Response) {
  res.render('payment_links/search', { csrf: req.csrfToken() })
}

export function searchRequest(req: Request, res: Response) {
  const id = req.body.id.trim()
  res.redirect(`/payment_links/${id}`)
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const paymentLink = indexPaymentLinkByType(await Products.getProduct(id))

    res.render('payment_links/detail', {
      paymentLink,
      url: paymentLink._indexedLinks.friendly || paymentLink._indexedLinks.pay,
      messages: req.flash('info'),
      csrf: req.csrfToken()
    })
  } catch (error) {
    next(error)
  }
}

export async function toggleRequireCaptcha(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const enabled = await Products.toggleRequireCaptcha(id)

    req.flash('info', `Require CAPTCHA ${enabled ? 'enabled' : 'disabled'}`)
    res.redirect(`/payment_links/${id}`)
  } catch (error) {
    next(error)
  }
}

interface PaymentLinkUsageContext {
  groupedPaymentLinks: any
  serviceGatewayAccountIndex: any
}
async function fetchUsageContext(sortKey: string, filterLiveAccounts: Boolean, accountId?: string): Promise<PaymentLinkUsageContext> {
  let serviceRequest, liveAccountsRequest
  if (accountId) {
    serviceRequest = AdminUsers.gatewayAccountServices(accountId)
      .then((service: any) => [service])
    liveAccountsRequest = Connector.account(accountId)
      .then((account: any) => [account])
  } else {
    serviceRequest = AdminUsers.services()
    liveAccountsRequest = Connector.accounts({ type: 'live' })
      .then((response: any) => response.accounts)
  }

  const paymentLinksRequest = Products.paymentLinksWithUsage(accountId)

  const [serviceResponse, paymentLinksResponse, liveAccountsResponse] = await Promise.all([serviceRequest, paymentLinksRequest, liveAccountsRequest])

  const serviceGatewayAccountIndex = aggregateServicesByGatewayAccountId(serviceResponse)

  const liveAccounts = liveAccountsResponse.map((account: any) => account.gateway_account_id)

  const paymentLinks = paymentLinksResponse
    .map((paymentLink: any) => {
      indexPaymentLinkByType(paymentLink.product)
      return paymentLink
    })
    .filter((link: any) => !filterLiveAccounts || liveAccounts.includes(link.product.gateway_account_id))
    .map((link: any) => {
      const service = serviceGatewayAccountIndex[link.product.gateway_account_id]
      return {
        ...link,
        is_live_account: liveAccounts.includes(link.product.gateway_account_id),
        url: link.product._indexedLinks.friendly || link.product._indexedLinks.pay,
        service_name: service && service.service_name && service.service_name.en,
        organisation_name: service && service.merchant_details && service.merchant_details.name,
        is_fixed_price: Boolean(link.product.price),
        has_metadata: Boolean(link.product.metadata)
      }
    })

  const groupedLinks = _.groupBy(paymentLinks, 'product.gateway_account_id')
  const orderedGroups = _.orderBy(
    Object.keys(groupedLinks)
      .map((key: any) => {
        const group = groupedLinks[key]
        return {
          key,
          links: _.orderBy(group, sortKey, 'desc'),
          payment_count: _.sumBy(group, 'payment_count'),
          last_payment_date: _.orderBy(group, 'last_payment_date', 'desc')[0].last_payment_date,
          is_live_account: liveAccounts.includes(key)
        }
      }),
    sortKey,
    'desc'
  )
  return {
    groupedPaymentLinks: orderedGroups,
    serviceGatewayAccountIndex
  }
}