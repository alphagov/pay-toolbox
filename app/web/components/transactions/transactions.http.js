const logger = require('./../../../lib/logger')

const { Connector } = require('./../../../lib/pay-request')
const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

const TransactionSearch = require('./transactionSearch.model')

const search = async function search (req, res, next) {
  const recovered = Object.assign({}, req.session.recovered)
  delete req.session.recovered
  res.render('transactions/search', { messages: req.flash('error'), recovered })
}

const searchTransaction = async function searchTransaction (req, res, next) {
  const search = new TransactionSearch(req.body)
  const searchMethod = search.byCharge ? Connector.searchTransactionsByChargeId : Connector.searchTransactionsByReference

  const response = await searchMethod(search.account_id, search.search_string)
  logger.info(`Successful search for ${search.search_string} on account ${search.account_id}`)
  res.render('transactions/search_results', { events: response.results })
}

const handlers = { search, searchTransaction }
module.exports = wrapAsyncErrorHandlers(handlers)
