// @FIXME(sfount) none of the date behavious are tested - ui tests for validation etc. unit tests for accepting params etc.
// @TODO(sfount) contract tests vs. all API end points that are concerned - this could borrow from and further self service pattern
// const logger = require('./../../../lib/logger')
const payapi = require('./../../../lib/pay-request')
const { Connector } = require('./../../../lib/pay-request')

const DateFilter = require('./dateFilter.model')

const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

// @FIXME(sfount) move to utility - see if there is a way of doing this in general on pay Node repos
// @FIXME(sfount) move to templater macro type file (probably in global config)
const toCurrencyString = amount => `£${amount.toFixed(2)}`


// @FIXME(sfount) this feels like confusing implementation logic and templating
// currently done like this to simply use the govuk front end macros
const formatOverviewStatsAsRows = function formatStatsAsRows (stats) {
  // @FIXME(sfount) replace these templates with a more robust library for currencies
  return [
    [ { text: 'Total Payments' }, { text: stats.total_volume } ],
    [ { text: 'Total Amount' }, { text: toCurrencyString(stats.total_amount) } ],
    [ { text: 'Average Amount' }, { text: toCurrencyString(stats.average_amount) } ]
  ]
}

const overview = async function overview (req, res, next) {
  const report = await Connector.performanceReport()
  res.render('statistics/overview', { stats: formatOverviewStatsAsRows(report) })
}

const isValidDate = function isValidDate (date) {
  return date instanceof Date && !isNaN(date)
}

// @TODO(sfount) there is duplication here with overview
const dateFilter = async function dateFilter (req, res, next) {
  const { date } = new DateFilter(req.body)
  const stats = await Connector.performanceReport({ date })

  // @FIXME(sfount) move this to the template - it shouldn't be in the controller - it is just to do with format
  res.render('statistics/overview', { date, stats: formatOverviewStatsAsRows(stats) })
}

// @FIXME(sfount) this is completely duplicated from `dateFilter`
const compareFilter = async function compareFilter (req, res, next) {
  const { date, compareDate } = new DateFilter(req.body)

  // const report = Connector.performanceReport({ date })
  // const compareReport = Connector.performanceReport({ date: compareDate })
  const [ stats, compareStats ] = await Promise.all([
    Connector.performanceReport({ date }),
    Connector.performanceReport({ date: compareDate })
  ])

  res.render('statistics/comparison', { date, compareDate, stats: formatOverviewStatsAsRows(stats), compareStats: formatOverviewStatsAsRows(compareStats) })
}

const byServices = async function byServices (req, res, next) {
  const servicesAPI = 'ADMINUSERS'
  const reportAPI = 'CONNECTOR'

  const servicesPath = '/v1/api/services/list'
  const reportPath = '/v1/api/reports/gateway-account-performance-report'

  // get service details
  const services = await payapi.service(servicesAPI, servicesPath)

  // get gateway account performance report
  const report = await payapi.service(reportAPI, reportPath)

  console.log(services)
  console.log(report)

  // @TODO(sfount) combine service details with gateway account performance report

  res.render('statistics/by_service', { stats: report })
}

const dateFilterRequest = (req, res, next) => res.render('statistics/filter_date')

const compareFilterRequest = (req, res, next) => res.render('statistics/filter_comparison')

const handlers = { overview, dateFilter, dateFilterRequest, compareFilter, compareFilterRequest, byServices }
module.exports = wrapAsyncErrorHandlers(handlers)
