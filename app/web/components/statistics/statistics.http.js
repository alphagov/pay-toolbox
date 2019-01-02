// @FIXME(sfount) none of the date behavious are tested - ui tests for validation etc. unit tests for accepting params etc.
// @TODO(sfount) contract tests vs. all API end points that are concerned - this could borrow from and further self service pattern
// const logger = require('./../../../lib/logger')
const payapi = require('./../../../lib/pay-request')

// @FIXME(sfount) move to utility - see if there is a way of doing this in general on pay Node repos
const toCurrencyString = function toCurrencyString (amount) {
  return `£${amount.toFixed(2)}`
}

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
  try {
    // @TODO(sfount) if this becomes any more complicated - delegate to seperate controller
    // @FIXME(sfount) change from string based method
    // @TODO(sfount) move this to use an object match instead of a string key
    // i.e payapi.ADMIN_USERS.get
    const API = 'CONNECTOR'
    const statsPath = '/v1/api/reports/performance-report'
    const response = await payapi.service(API, statsPath)

    console.log('got stats request result', response)
    // @TODO(sfount) what if
    // - api doesn't exist
    // - request is rejected
    res.render('statistics/overview', { stats: formatOverviewStatsAsRows(response) })
  } catch (error) {
    // @TODO(sfount) catch and handle 500/ ECONREFUSED errors with a generic
    // error message on 'errors/service' page stating that connection with
    // service failed
    console.log(error.code)

    // @TODO(sfount) move to utility to check codes
    // @FIXME(sfount) actually move this
    if (error.code === 'ECONNRESET') {
      // service wasn't available

    }

    if (error.response && error.response.status === 500) {
      // service failed for some reason

    }

    // otherwise
    next(error)
  }
}

const isValidDate = function isValidDate (date) {
  return date instanceof Date && !isNaN(date)
}

// @TODO(sfount) there is duplication here with overview
const dateFilter = async function dateFilter (req, res, next) {
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

const dateFilterRequest = async function dateFilterRequest (req, res, next) {
  res.render('statistics/filter_date')
}

const compareFilterRequest = async function dateCompareRequest (req, res, next) {
  res.render('statistics/filter_comparison')
}

module.exports = { overview, dateFilter, dateFilterRequest, compareFilter, compareFilterRequest, byServices }
