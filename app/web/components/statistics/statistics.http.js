const { Connector, AdminUsers } = require('./../../../lib/pay-request')
const DateFilter = require('./dateFilter.model')

const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')
const { formatStatsAsTableRows } = require('./statistics.utils.js')

const overview = async function overview (req, res, next) {
  const report = await Connector.performanceReport()
  res.render('statistics/overview', { stats: formatStatsAsTableRows(report) })
}

const dateFilterRequest = (req, res, next) => res.render('statistics/filter_date')

const dateFilter = async function dateFilter (req, res, next) {
  const { date } = new DateFilter(req.body)
  const stats = await Connector.performanceReport({ date })

  res.render('statistics/overview', { date, stats: formatStatsAsTableRows(stats) })
}

const compareFilterRequest = (req, res, next) => res.render('statistics/filter_comparison')

const compareFilter = async function compareFilter (req, res, next) {
  const { date, compareDate } = new DateFilter(req.body)
  const [ stats, compareStats ] = await Promise.all([
    Connector.performanceReport({ date }),
    Connector.performanceReport({ date: compareDate })
  ])

  res.render('statistics/comparison', { date, compareDate, stats: formatStatsAsTableRows(stats), compareStats: formatStatsAsTableRows(compareStats) })
}

// @TODO(sfount) route note complete - combine service details with gateway account performance report
const byServices = async function byServices (req, res, next) {
  const [ services, report ] = await Promise.all([
    AdminUsers.services(),
    Connector.gatewayAccountPerformanceReport()
  ])

  res.render('statistics/by_service', { stats: report })
}

const handlers = { overview, dateFilter, dateFilterRequest, compareFilter, compareFilterRequest, byServices }
module.exports = wrapAsyncErrorHandlers(handlers)
