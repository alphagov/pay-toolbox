const moment = require('moment')
const { Parser } = require('json2csv')
const logger = require('../../../lib/logger')
const { Connector, Ledger, AdminUsers } = require('./../../../lib/pay-request')
const DateFilter = require('./dateFilter.model')

const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')
const { formatStatsAsTableRows } = require('./statistics.utils.js')

const startOfGovUkPay = moment.utc().month(8).year(2016)

const overview = async function overview (req, res) {
  const report = await Connector.performanceReport()
  res.render('statistics/overview', { stats: formatStatsAsTableRows(report) })
}

const dateFilterRequest = function dateFilterRequest (req, res) {
  const date = new Date()
  res.render('statistics/filter_date', { date, csrf: req.csrfToken() })
}

const dateFilter = async function dateFilter (req, res) {
  const { date } = new DateFilter(req.body)
  const stats = await Connector.dailyPerformanceReport(date)

  res.render('statistics/overview', { date, stats: formatStatsAsTableRows(stats) })
}

const compareFilterRequest = function compareFilterRequest (req, res) {
  const date = new Date()
  const comparison = new Date()
  comparison.setDate(date.getDate() - 1)
  res.render('statistics/filter_comparison', { date, comparison, csrf: req.csrfToken() })
}

const compareFilter = async function compareFilter (req, res) {
  const { date, compareDate } = new DateFilter(req.body)
  const [stats, compareStats] = await Promise.all([
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

const csvServices = async function csvServices (req, res) {
  res.render('statistics/by_gateway_csv', { csrf: req.csrfToken() })
}

const byServices = async function byServices (req, res, next) {
  const { options } = req.body
  const forAllTime = options === 'all'
  const fromDate = forAllTime ? startOfGovUkPay : moment.utc().startOf('month')
  const toDate = moment.utc().endOf('month')

  logger.info(`Transaction volumes by gateway account for ${toDate.diff(fromDate, 'days')} days`, {
    from_date: fromDate.format('YYYY-MM-DD'),
    to_date: toDate.format('YYYY-MM-DD'),
    number_of_days: toDate.diff(fromDate, 'days')
  })

  try {
    const [gatewayAccountsResponse, services] = await Promise.all([Connector.accounts(), AdminUsers.services()])
    const { accounts } = gatewayAccountsResponse

    // Generate all months between from and to date
    const compareDate = fromDate.clone()
    const yearMonthValues = [compareDate.format('YYYY-MM')]

    const fields = [{
      label: 'GOV.UK Pay account ID',
      value: 'gateway_account_id'
    }, {
      label: 'Service name',
      value: 'service_name'
    }, {
      label: 'GOV.UK Pay internal description',
      value: 'description'
    }, {
      label: 'Organisation name',
      value: 'organisation_name'
    }, {
      label: 'Sector',
      value: 'sector'
    }, {
      label: 'Payment service provider',
      value: 'payment_provider'
    }, {
      label: 'Service went live date',
      value: 'went_live_date'
    }]

    if (forAllTime) {
      fields.push({ label: 'Starting month', value: 'starting_month'})
    }

    do {
      const key = compareDate.format('YYYY-MM')
      yearMonthValues.push(key)
      fields.push({ label: key, value: key })
      compareDate.add(1, 'month')
    } while (compareDate.isBefore(toDate))

    let serviceDataMap = {}
    services.forEach((service) => {
      Object.assign(
        serviceDataMap,
        service.gateway_account_ids.reduce((aggregate, accountId) => {
          aggregate[accountId] = {
            service: service.service_name && service.service_name.en,
            organisation: service.merchant_details && service.merchant_details.name,
            sector: service.sector,
            went_live_date: service.went_live_date,
            internal: service.internal,
            archived: service.archived,
          }
          return aggregate
        }, {})
      )
    })

    const liveGatewayAccounts = accounts
      .filter((account) => {
        const serviceData = serviceDataMap[account.gateway_account_id]
        return account.type === 'live'
          && serviceData
          && !serviceData.internal
          && !serviceData.archived
      })
      .map((account) => {
        const serviceData = serviceDataMap[account.gateway_account_id]
        account.service_name = serviceData.service || account.service_name
        account.organisation_name = serviceData.organisation || ''
        account.sector = serviceData.sector
        account.went_live_date = serviceData.went_live_date
        return account
      })

    const parser = new Parser({ fields })
    res.set('Content-Type', 'text/csv')
    res.set('Content-Disposition', `attachment; filename="GOVUK_Pay_platform_transactions_by_service_month_${fromDate.format('YYYY-MM')}_${toDate.format('YYYY-MM')}.csv"`)
    res.write(parser.getHeader())
    res.flushHeaders()

    const gatewayAccountReport = await Ledger.gatewayMonthlyPerformanceReport(fromDate.format("YYYY-MM-DD"), toDate.format("YYYY-MM-DD"))

    // default 0 amounts for all months and all gateway accounts
    const report_schema = liveGatewayAccounts
      .map((gatewayAccount) => yearMonthValues
        .reduce((aggregate, month) => {
          aggregate[month] = 0
          return aggregate
        }, {
          gateway_account_id: gatewayAccount.gateway_account_id,
          service_name: gatewayAccount.service_name,
          description: gatewayAccount.description,
          organisation_name: gatewayAccount.organisation_name,
          payment_provider: gatewayAccount.payment_provider,
          sector: gatewayAccount.sector,
          went_live_date: gatewayAccount.went_live_date && moment(gatewayAccount.went_live_date).format('YYYY-MM-DD') || ''
        })
      )

    const completedReport = report_schema.map((emptyMonthlyReport) => {
      for (let i = 0; i < gatewayAccountReport.length; i++) {
        if (gatewayAccountReport[i].gateway_account_id === emptyMonthlyReport.gateway_account_id) {
          const zeroIndexedMonth = Number(gatewayAccountReport[i].month) - 1
          const date = moment().utc().year(gatewayAccountReport[i].year).month(zeroIndexedMonth)
          emptyMonthlyReport[date.format('YYYY-MM')] = gatewayAccountReport[i].total_volume

          if (forAllTime && (!emptyMonthlyReport.starting_month || date.isBefore(moment(emptyMonthlyReport.starting_month)))) {
            emptyMonthlyReport.starting_month =  date.format('YYYY-MM')
          }
        }
      }
      return emptyMonthlyReport
    })
    res.write(`\n${parser.processData(completedReport)}`)

    res.end()
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
