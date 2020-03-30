import { Request, Response, NextFunction } from 'express'
import { Products, Connector, AdminUsers } from '../../../lib/pay-request'

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let account
    const { accountId } = req.params

    const paymentLinksRepsonse = await Products.paymentLinksByGatewayAccount(accountId)
    const paymentLinks = paymentLinksRepsonse
      .filter((link: any) => !(link.type === 'PROTOTYPE'))
      .map((link: any) => {
        const index = link._links.reduce((aggregate: any, linkDetails: any) => {
          aggregate[linkDetails.rel] = linkDetails.href
          return aggregate
        }, {})
        link._indexedLinks = index
        return link
      })

    if (accountId) {
      account = await AdminUsers.gatewayAccountServices(accountId)
    }

    res.render('payment_links/overview', {
      account, paymentLinks
    })
  } catch (error) {
    next(error)
  }
}