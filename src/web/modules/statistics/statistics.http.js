const { Connector, AdminUsers } = require('./../../../lib/pay-request')
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
  res.render('statistics/filter_comparison', { date, comparison })
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

// @TODO(sfount) route not complete - combine service details with gateway
//               account performance report
const byServices = async function byServices(req, res) {
  const [ services, report ] = await Promise.all([
    AdminUsers.services(),
    Connector.gatewayAccountPerformanceReport()
  ])

  res.render('statistics/by_service', { stats: report, services })
}

const handlers = {
  overview, dateFilter, dateFilterRequest, compareFilter, compareFilterRequest, byServices
}
module.exports = wrapAsyncErrorHandlers(handlers)
