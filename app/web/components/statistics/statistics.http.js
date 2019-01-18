// @FIXME(sfount) none of the date behavious are tested - ui tests for validation etc. unit tests for accepting params etc.
// @TODO(sfount) contract tests vs. all API end points that are concerned - this could borrow from and further self service pattern
// const logger = require('./../../../lib/logger')
const payapi = require('./../../../lib/pay-request')
const { Connector } = require('./../../../lib/pay-request')

const { DateFilter } = require('./dateFilter.model')

const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')

// @FIXME(sfount) move to utility - see if there is a way of doing this in general on pay Node repos
const toCurrencyString = amount => `£${amount.toFixed(2)}`

// @FIXME(sfount) move to templater macro type file (probably in global config)

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

  // model dates as DateFilter
  // 1. handle ValidationError
  // 2.
  // n. make a statistics exceptions file
  //
  const report = await Connector.performanceReport()

  try {
    // @TODO(sfount) this is enough logic to move it out of the HTTP response method
    const API = 'CONNECTOR'
    const statsPath = '/v1/api/reports/performance-report'

    // @FIXME(sfount) clean this up - list expected params - require them, throw appropriate error if not (potentially use Joi library)
    const dateFilter = new Date(req.body['filter-year'], req.body['filter-month'] - 1, req.body['filter-day'])

    console.log('dateFilter', dateFilter)
    if (!isValidDate(dateFilter)) {
      throw new Error(`Invalid date paresed from POST body`)
    }

    const response = await payapi.service(API, statsPath, { date: JSON.stringify(dateFilter) })

    res.render('statistics/overview', { dateFilter, stats: formatOverviewStatsAsRows(response) })
  } catch (error) {
    if (error.code === 'ECONNRESET') { }
    if (error.response && error.response.status === 500) { }
    next(error)
  }
}

// @FIXME(sfount) this is completely duplicated from `dateFilter`
const compareFilter = async function compareFilter (req, res, next) {
  try {
    const API = 'CONNECTOR'
    const statsPath = '/v1/api/reports/performance-report'

    const firstDateFilter = new Date(req.body['filter-first-year'], req.body['filter-first-month'] - 1, req.body['filter-first-day'])
    const secondDateFilter = new Date(req.body['filter-second-year'], req.body['filter-second-month'] - 1, req.body['filter-second-day'])

    if (!isValidDate(firstDateFilter) || !isValidDate(secondDateFilter)) {
      throw new Error('Invalid date parsed from POST body')
    }

    const firstRequest = payapi.service(API, statsPath, { date: JSON.stringify(firstDateFilter) })
    const secondRequest = payapi.service(API, statsPath, { date: JSON.stringify(secondDateFilter) })
    const response = await Promise.all([firstRequest, secondRequest])

    // the order of these probably isn't guaranteed @FIXME(sfount)
    // @FIXME(sfount) this is not good code
    res.render('statistics/comparison', { firstDateFilter, secondDateFilter, firstDateStats: formatOverviewStatsAsRows(response[0]), secondDateStats: formatOverviewStatsAsRows(response[1]) })
  } catch (error) {
    if (error.code === 'ECONNRESET') { }
    if (error.response && error.response.status === 500) { }
    next(error)
  }
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
