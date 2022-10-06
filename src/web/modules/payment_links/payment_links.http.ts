import _ from 'lodash'
import {NextFunction, Request, Response} from 'express'
import {AdminUsers, Connector, Products} from '../../../lib/pay-request/typed_clients/client'
import type {Product} from '../../../lib/pay-request/typed_clients/services/products/types'
import {aggregateServicesByGatewayAccountId} from '../../../lib/gatewayAccounts'
import {format} from './csv'
import {AccountType} from "../../../lib/pay-request/typed_clients/shared";

function getLinksForProductIndexedByType(paymentLink: Product) {
  return paymentLink._links.reduce((aggregate: { [key: string]: string }, linkDetails) => {
    aggregate[linkDetails.rel] = linkDetails.href
    return aggregate
  }, {})
}

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const {accountId} = req.params
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
    const {accountId} = req.params
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
  res.render('payment_links/search', {csrf: req.csrfToken()})
}

export function searchRequest(req: Request, res: Response) {
  const id = req.body.id.trim()
  res.redirect(`/payment_links/${id}`)
}

export async function detail(req: Request, res: Response, next: NextFunction) {
  try {
    const {id} = req.params
    const paymentLink = await Products.products.retrieve(id)
    const indexedLinks = getLinksForProductIndexedByType(paymentLink)

    res.render('payment_links/detail', {
      paymentLink,
      url: indexedLinks.friendly || indexedLinks.pay,
      messages: req.flash('info'),
      csrf: req.csrfToken()
    })
  } catch (error) {
    next(error)
  }
}

export async function toggleRequireCaptcha(req: Request, res: Response, next: NextFunction) {
  try {
    const {id} = req.params
    const product = await Products.products.retrieve(id)
    const enable = !product.require_captcha
    await Products.products.update(id, product.gateway_account_id, {require_captcha: enable})

    req.flash('info', `Require CAPTCHA ${enable ? 'enabled' : 'disabled'}`)
    res.redirect(`/payment_links/${id}`)
  } catch (error) {
    next(error)
  }
}

async function fetchUsageContext(sortKey: string, filterLiveAccounts: Boolean, accountId?: string) {
  let serviceRequest, liveAccountsRequest
  if (accountId) {
    serviceRequest = AdminUsers.services.retrieve({gatewayAccountId: accountId})
      .then((service) => [service])
    liveAccountsRequest = Connector.accounts.retrieveAPI(accountId)
      .then((account) => [account])
  } else {
    serviceRequest = AdminUsers.services.list()
    liveAccountsRequest = Connector.accounts.list({type: AccountType.Live})
      .then((response) => response.accounts)
  }

  const productStatsRequest = Products.reports.listStats({
    ...accountId && {gatewayAccountId: Number(accountId)}
  })

  const [serviceResponse, productStatsResponse, liveAccountsResponse] = await Promise.all([serviceRequest, productStatsRequest, liveAccountsRequest])

  const serviceGatewayAccountIndex = aggregateServicesByGatewayAccountId(serviceResponse)

  const liveAccounts = liveAccountsResponse.map((account: any) => account.gateway_account_id)

  const paymentLinks = productStatsResponse
    .filter((productStat) => !filterLiveAccounts || liveAccounts.includes(productStat.product.gateway_account_id))
    .map((productStat) => {
      const service = serviceGatewayAccountIndex[productStat.product.gateway_account_id]
      const indexedLinks = getLinksForProductIndexedByType(productStat.product)
      return {
        ...productStat,
        is_live_account: liveAccounts.includes(productStat.product.gateway_account_id),
        url: indexedLinks.friendly || indexedLinks.pay,
        service_name: service && service.service_name && service.service_name.en,
        organisation_name: service && service.merchant_details && service.merchant_details.name,
        is_fixed_price: Boolean(productStat.product.price),
        has_metadata: Boolean(productStat.product.metadata)
      }
    })

  const groupedLinks = _.groupBy(paymentLinks, 'product.gateway_account_id')
  const orderedGroups = _.orderBy(
    Object.keys(groupedLinks)
      .map((key) => {
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
