const logger = require('./../../../lib/logger')

const { Connector } = require('./../../../lib/pay-request')
const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

const search = async function searchTransaction(req, res) {
  res.render('discrepancies/report')
}

const getDiscrepancyReport = async function searchTransaction(req, res) {
  const chargeIds = req.body.search_string.split(',')
  const comparisons = await Connector.getGatewayComparisons(chargeIds)

  const interpretedComparisons = comparisons.map((comparison) => {
    comparison.canBeResolved = comparison.gatewayExternalStatus !== comparison.payExternalStatus
    return comparison
  })

  res.render('discrepancies/search_results', { comparisons: interpretedComparisons })
}

const resolveDiscrepancy = async function resolveDiscrepancy(req, res) {
  const chargeId = req.params.id
  const [ resolution ] = await Connector.resolveDiscrepancy(chargeId)
  logger.info(`Resolution successful for ${chargeId}`)

  res.render('discrepancies/resolution', { resolution })
}

const handlers = { search, getDiscrepancyReport, resolveDiscrepancy }
module.exports = wrapAsyncErrorHandlers(handlers)
