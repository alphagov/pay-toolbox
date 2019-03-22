const logger = require('./../../../lib/logger')

const { Connector } = require('./../../../lib/pay-request')
const { ValidationError } = require('./../../../lib/errors')
const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

const TransactionSearch = require('./transactionSearch.model')

const search = async function search(req, res, next) {
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

const searchTransaction = async function searchTransaction(req, res, next) {
  const search = new TransactionSearch(req.body)
  const chargeId = search.byCharge ? search.search_string : await getChargeIdFromReference(search.account_id, search.search_string)
  const response = await Connector.searchTransactionsByChargeId(search.account_id, chargeId)

  logger.info(`Successful search for ${search.search_string} on account ${search.account_id}`)
  res.render('transactions/search_results', { events: response.events, chargeId })
}

const handlers = { search, searchTransaction }
module.exports = wrapAsyncErrorHandlers(handlers)
