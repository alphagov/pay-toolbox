const { Connector } = require('./../../../lib/pay-request')
const DateFilter = require('./dateFilter.model')

const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')
const { formatStatsAsTableRows } = require('./statistics.utils.js')

const overview = async function overview(req, res) {
  const report = await Connector.performanceReport()
  res.render('statistics/overview', { stats: formatStatsAsTableRows(report) })
}

const dateFilterRequest = function dateFilterRequest(req, res) {
  const date = new Date()
  res.render('statistics/filter_date', { date, csrf: req.csrfToken() })
}

const dateFilter = async function dateFilter(req, res) {
  const { date } = new DateFilter(req.body)
  const stats = await Connector.dailyPerformanceReport(date)

  res.render('statistics/overview', { date, stats: formatStatsAsTableRows(stats) })
}

const compareFilterRequest = function compareFilterRequest(req, res) {
  const date = new Date()
  const comparison = new Date()
  comparison.setDate(date.getDate() - 1)
  res.render('statistics/filter_comparison', { date, comparison, csrf: req.csrfToken() })
}

const compareFilter = async function compareFilter(req, res) {
  const { date, compareDate } = new DateFilter(req.body)
  const [ stats, compareStats ] = await Promise.all([
    Connector.dailyPerformanceReport(date),
    Connector.dailyPerformanceReport(compareDate)
  ])

  res.render('statistics/comparison', {
    date,
    compareDate,
    stats: formatStatsAsTableRows(stats),
    compareStats: formatStatsAsTableRows(compareStats)
  })
}

const byServices = async function byServices(req, res) {
  const [ gatewayAccountsResponse, gatewayAccountReport ] = await Promise.all([
    Connector.accounts(),
    Connector.gatewayAccountPerformanceReport()
  ])
  const { accounts } = gatewayAccountsResponse

  const indexedAccounts = accounts.reduce((aggregate, account) => {
    // eslint-disable-next-line no-param-reassign
    aggregate[account.gateway_account_id] = account
    return aggregate
  }, {})

  const report = Object.keys(gatewayAccountReport)
    // eslint-disable-next-line arrow-body-style
    .map((key) => {
      return { ...gatewayAccountReport[key], ...indexedAccounts[key] }
    })
  res.render('statistics/by_service', { report })
}

const handlers = {
  overview, dateFilter, dateFilterRequest, compareFilter, compareFilterRequest, byServices
}
module.exports = wrapAsyncErrorHandlers(handlers)
