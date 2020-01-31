import Stripe from 'stripe'
import HTTPSProxyAgent from 'https-proxy-agent'

import * as config from '../../../config'

import logger = require('../../../lib/logger');

const stripe = new Stripe(process.env.STRIPE_ACCOUNT_API_KEY)
stripe.setApiVersion('2018-09-24')

// @ts-ignore
if (config.server.HTTPS_PROXY) stripe.setHttpAgent(new HTTPSProxyAgent(config.server.HTTPS_PROXY))

const MAX_PAGE_SIZE = 100

const getPage = async function getPage(
  accountId: string,
  payoutId: string,
  startingAfter?: string
): Promise<Stripe.IList<Stripe.balance.IBalanceTransaction>> {
  const limits = {
    limit: MAX_PAGE_SIZE,
    payout: payoutId,
    expand: [ 'data.source', 'data.source.source_transfer', 'data.source.charge', 'data.source.charge.source_transfer' ],
    ...startingAfter && { starting_after: startingAfter }
  }

  // @ts-ignore
  const result = await stripe.balanceTransactions.list(limits, { stripe_account: accountId })

  logger.info(`[pages] fetched ${result.data.length} transactions for ${payoutId} [has_more=${result.has_more}]`)
  return result
}

const all = async function all(
  accountId: string,
  payoutId: string
): Promise<Stripe.balance.IBalanceTransaction[]> {
  const transactions: Stripe.balance.IBalanceTransaction[] = []
  const initialPage = await getPage(accountId, payoutId)

  transactions.push(...initialPage.data)

  const status = { moreTransactionsExist: initialPage.has_more }

  while (status.moreTransactionsExist) {
    const latestTransaction = transactions[transactions.length - 1]
    // eslint-disable-next-line no-await-in-loop
    const page = await getPage(accountId, payoutId, latestTransaction.id)
    transactions.push(...page.data)
    status.moreTransactionsExist = page.has_more
  }
  return transactions
}

export async function getTransactionsForPayout(
  stripeAccountId: string,
  payout: Stripe.payouts.IPayout
): Promise<Stripe.balance.IBalanceTransaction[]> {
  return all(stripeAccountId, payout.id)
}
