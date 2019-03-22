const logger = require('./../../../lib/logger')

const { Connector } = require('./../../../lib/pay-request')
const { ValidationError } = require('./../../../lib/errors')
const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

const TransactionSearch = require('./transactionSearch.model')

const search = async function search(req, res) {
  const recovered = Object.assign({}, req.session.recovered)
  delete req.session.recovered
  res.render('transactions/search', { messages: req.flash('error'), recovered })
}

const getChargeIdFromReference = async function getChargeIdFromReference(accountId, reference) {
  const response = await Connector.searchTransactionsByReference(accountId, reference)
  const totalResults = Number(response.total)
  logger.info(`Searched for transactions with reference ${reference}`)

  // legacy toolbox search method only supported finding one transaction by reference
  if (!totalResults) {
    throw new ValidationError('No transactions returned for reference query')
  }
  if (totalResults > 1) {
    throw new ValidationError('Search doesn\'t support ambiguous references (multiple transactions returned)')
  }

  const [ charge ] = response.results
  logger.info(`Reference search found single transaction with charge ID ${charge.charge_id}`)
  return charge.charge_id
}

const searchTransaction = async function searchTransaction(req, res) {
  const searchParams = new TransactionSearch(req.body)
  const chargeId = searchParams.byCharge
    ? searchParams.search_string
    : await getChargeIdFromReference(searchParams.account_id, searchParams.search_string)
  const response = await Connector.searchTransactionsByChargeId(searchParams.account_id, chargeId)

  logger.info(`Successful search for ${searchParams.search_string} on account ${searchParams.account_id}`)
  res.render('transactions/search_results', { events: response.events, chargeId })
}

const handlers = { search, searchTransaction }
module.exports = wrapAsyncErrorHandlers(handlers)
