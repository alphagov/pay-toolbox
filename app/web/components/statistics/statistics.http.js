const logger = require('./../../../lib/logger')
const payapi = require('./../../../lib/pay-request')

// @FIXME(sfount) move to utility - see if there is a way of doing this in general on pay Node repos
const toCurrencyString = function toCurrencyString(amount) {
  return `£${amount.toFixed(2)}`
}

// @FIXME(sfount) move to templater macro type file (probably in global config)

// @FIXME(sfount) this feels like confusing implementation logic and templating
// currently done like this to simply use the govuk front end macros
const formatOverviewStatsAsRows = function formatStatsAsRows(stats) {
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

module.exports = { overview }
