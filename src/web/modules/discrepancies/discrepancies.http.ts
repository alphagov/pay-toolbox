import { Request, Response, NextFunction } from 'express'

import logger from './../../../lib/logger'
import { Connector } from '../../../lib/pay-request/client'
import { wrapAsyncErrorHandlers } from './../../../lib/routes'

const searchTransaction = async function searchTransaction(req: Request, res: Response) {
  res.render('discrepancies/report', { csrf: req.csrfToken() })
}

const getDiscrepancyReport = async function getDiscrepancyReport(req: Request, res: Response) {
  const chargeIds = req.body.search_string.split(',').map((chargeId: string) => chargeId.trim())
  const comparisons = await Connector.charges.getGatewayComparisons(chargeIds)

  const interpretedComparisons = comparisons.map((comparison) => {
    const interpretedComparison = {
      ...comparison,
      canBeResolved: comparison.gatewayStatus !== comparison.payExternalStatus
    }
    return interpretedComparison
  })

  res.render('discrepancies/search_results', { comparisons: interpretedComparisons, csrf: req.csrfToken() })
}

const resolveDiscrepancy = async function resolveDiscrepancy(req: Request, res: Response) {
  const chargeId = req.params.id
  const [resolution] = await Connector.charges.resolveDiscrepancy(chargeId)
  logger.info(`Resolution successful for ${chargeId}`)

  res.render('discrepancies/resolution', { resolution })
}

const handlers = { search: searchTransaction, getDiscrepancyReport, resolveDiscrepancy }
module.exports = wrapAsyncErrorHandlers(handlers)
