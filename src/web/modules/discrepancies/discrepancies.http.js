const logger = require('./../../../lib/logger')

const { Connector } = require('./../../../lib/pay-request')
const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

const searchTransaction = async function searchTransaction(req, res) {
  res.render('discrepancies/report', { csrf: req.csrfToken() })
}

const getDiscrepancyReport = async function getDiscrepancyReport(req, res) {
  const chargeIds = req.body.search_string.split(',').map(chargeId => chargeId.trim())
  const comparisons = await Connector.getGatewayComparisons(chargeIds)

  const interpretedComparisons = comparisons.map((comparison) => {
    const interpretedComparison = { ...comparison }
    // eslint-disable-next-line max-len
    interpretedComparison.canBeResolved = comparison.gatewayExternalStatus !== comparison.payExternalStatus
    return interpretedComparison
  })

  res.render('discrepancies/search_results', { comparisons: interpretedComparisons, csrf: req.csrfToken() })
}

const resolveDiscrepancy = async function resolveDiscrepancy(req, res) {
  const chargeId = req.params.id
  const [ resolution ] = await Connector.resolveDiscrepancy(chargeId)
  logger.info(`Resolution successful for ${chargeId}`)

  res.render('discrepancies/resolution', { resolution })
}

const handlers = { search: searchTransaction, getDiscrepancyReport, resolveDiscrepancy }
module.exports = wrapAsyncErrorHandlers(handlers)
