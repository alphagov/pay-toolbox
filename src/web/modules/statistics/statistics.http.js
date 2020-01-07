const moment = require('moment')
const { Parser } = require('json2csv')
const { Connector, Ledger, AdminUsers } = require('./../../../lib/pay-request')
const DateFilter = require('./dateFilter.model')

const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')
const { formatStatsAsTableRows } = require('./statistics.utils.js')

const { ValidationError } = require('../../../lib/errors')

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

const csvServices = async function csvServices(req, res) {
  const now = moment().startOf('year')
  const interimYear = moment().year('2015').startOf('year')
  const years = []

  while (interimYear.isSameOrBefore(now)) {
    years.push(interimYear.format('Y'))
    interimYear.add(1, 'year')
  }

  res.render('statistics/by_gateway_csv', {
    years,
    months: moment.months(),
    csrf: req.csrfToken()
  })
}

const byServices = async function byServices(req, res, next) {
  const fromDate = moment().utc().month(req.body.from_month).year(req.body.from_year).startOf('month')
  const toDate = moment().utc().month(req.body.to_month).year(req.body.to_year).endOf('month')

  try {
    if (fromDate.isAfter(toDate)) {
      throw new ValidationError('From date cannot be later than to date')
    }

    const [ gatewayAccountsResponse, gatewayAccountReport, services ] = await Promise.all([
      Connector.accounts(),
      Ledger.gatewayMonthlyPerformanceReport(fromDate.format(), toDate.format()),
      AdminUsers.services()
    ])
    const { accounts } = gatewayAccountsResponse

    // Generate all the months in between the selected dates
    const interim = fromDate.clone() // Perhaps remove and just use fromDate
    const yearMonthValues = [ interim.format('YYYY-MM') ]

    while (!(interim.format('M') === toDate.format('M') && interim.format('Y') === toDate.format('Y'))) {
      interim.add(1, 'month')
      yearMonthValues.push(interim.format('YYYY-MM'))
    }

    // Get all live gateway accounts from Connector but needs service_name from Adminusers
    const liveGatewayAccounts = accounts
    .filter((account) => account.type === 'live')
    .map((account) => ({
        gateway_account_id: account.gateway_account_id,
        service_name: '',
        description: account.description
      }))
    .map((account) => {
      for (let i = 0; i < services.length; i += 1) {
        const service = services[i]
        if (service.gateway_account_ids.includes(account.gateway_account_id.toString())) {
          account.service_name = service.name
          break
        }
      }
      return account
    })

    // Generate blank report
    const report_schema = liveGatewayAccounts
    .map((gatewayAccount) => yearMonthValues
    .reduce((aggregate, month) => {
        aggregate[month] = 0
        return aggregate
        }, {
          gatewayAccountId: gatewayAccount.gateway_account_id,
          service_name: gatewayAccount.service_name,
          description: gatewayAccount.description
        }))

    const completedReport = report_schema.map((emptyMonthlyReport) => {
      for (let i = 0; i < gatewayAccountReport.length; i += 1) {
        if (gatewayAccountReport[i].gateway_account_id === emptyMonthlyReport.gatewayAccountId) {
          const monthAsString = (gatewayAccountReport[i].month).toString()
          const month = monthAsString.length === 2 ? monthAsString : `0${monthAsString}`
          const yearMonthValue = `${gatewayAccountReport[i].year}-${month}`
          emptyMonthlyReport[yearMonthValue] = gatewayAccountReport[i].total_volume
        }
      }
      return emptyMonthlyReport
    })

    const fields = Object.keys(completedReport[0])
    const json2csvParser = new Parser({ fields })
    const csv = json2csvParser.parse(completedReport)

    res.set('Content-Type', 'text/csv')
    res.set('Content-Disposition', 'attachment; filename="year.csv"')
    res.status(200).send(csv)
  } catch (error) {
    next(error)
  }
}

const handlers = {
  overview,
  dateFilter,
  dateFilterRequest,
  compareFilter,
  compareFilterRequest,
  csvServices,
  byServices
}
module.exports = wrapAsyncErrorHandlers(handlers)
