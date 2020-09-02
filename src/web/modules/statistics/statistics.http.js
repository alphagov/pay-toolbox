const moment = require('moment')
const { Parser } = require('json2csv')
const { Connector, Ledger, AdminUsers } = require('./../../../lib/pay-request')
const { Form, validate } = require('./forms/form')
const DateFilter = require('./dateFilter.model')

const { wrapAsyncErrorHandlers } = require('./../../../lib/routes')
const { formatStatsAsTableRows } = require('./statistics.utils.js')
const { input } = require('../../../lib/logger')

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
    res.flush()

    const gatewayAccountReport = await Ledger.gatewayMonthlyPerformanceReport(fromDate.format(), toDate.format())

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

const anchors = {
  date_filter: 'date'
}

// TODO(sfount) server side validation might not be able to be split up as cleanly as other
/** some might
 * // everything custom is automatically processed async? this will mean you need to await the form
 * // potentially there should be promise _versions_ of the method like this aws
 * // Form.validate().promise()
 * // if you just asked for validate you would get the sync results but you wouldn't get the things that need to be looked up (gracefully)
 *
 * // if you CAN know validation _before_ doing the operation
 * validateCustom(async (inputString) => {
 *  const checkReference = await Ledger.transaction.list({ reference: inputString })
 *  if (!checkReference) {
 *
 *    // @sfount - the _id_, href, etc. are all filled in nicely for you on custom validation
 *    return {
 *      valid: false,
 *      reason: 'Did not know anything about the reference in the database'
 *    }
 *  }
 * })
 *
 * // if you CANT know validation _before_ doing the operation but need to respond to the form after trying to do the action
 * } catch (error) {
 *  if (error.error_identifer === 'SOME_CODE_WE_KNOW') {
 *    // takes care of assigning the failed validation _to_ that component
 *    // takes care of making sure the error summary list is up to date and references that component
 *    form.submissionError(form.id_of_component, 'Did not know anything about the reference in the database')
 *    res.render('page', { form })
 *  }
 * }
 *
*/


// id: id that should be used for the form element (this will identify it in HTML and in the lib)s
// name?: optional name for the form element, this is what will come back in the post body, if this isn't set id will be used
// alias?: this is what will be returned in the formatted model, if this isn't set name will be used
// type?: optionally specify a data type, for more complex data models this will help the util parse multiple values (for example dates)
// ?granularity: 'date' | 'month' -- needs a better name than granularity
const dateFilterInput = {
  id: 'date_filter',
  type: 'date',
  rules: [
    validate.realDate(),
    // validate.isAfter('2020-08-01', true),
    // validate.isBefore('2020-08-30', true),
    // validate.isBetween('2020-08-01', '2020-08-30'),
    // validate.isFuture(false),
    validate.isPast(false),
    // validate.isBefore('2020-08-30', true),
  ],
  messages: {
    token: 'filter date'
  }
}
// rules: [ validate.isBefore('') ],
// messages: {
//  token: 'your first name'
//  override: {
//    input_must_exist: 'Theres no way your first name is optional mayn'
//  }
// }

// @TODO(sfount) try and really be focussed on a separation
// ID is the _only_ link between data and view
// ID _must_ be a valid JSON key
// everything about _showing_ the thing is defined in the template (where possible, overrides for messages etc. are allowed in either place)
// everything about _the data_ is defined here
// here is about defining a standard form model that will be used to accept data from the frontend, do validation, send data to the backend
const nameInput = {
  id: 'first_name',
  rules: [
    validate.maximumCharacterLength(10),
    validate.minimumCharacterLength(5)
  ],
  messages: {
    token: 'your first name'
  }
}
const secondName = {
  id: 'second_name',
  rules: [
    validate.maximumCharacterLength(10),
    validate.minimumCharacterLength(5)
  ],
  messages: {
    token: 'your second name'
  }
}

// const DateFilterForm = new Form(dateFilterInput, nameInput, secondName)
const DateFilterForm = new Form(dateFilterInput, nameInput, secondName)
const filter = function filter(req, res, next) {
  const dateFilterForm = DateFilterForm.empty()
  res.render('statistics/filter', { csrf: req.csrfToken(), dateFilterForm })
}

const submitFilter = function submitFilter(req, res, next) {
  const dateFilterForm = DateFilterForm.validate(req.body)
  console.log('got submission', req.body)
  console.log(dateFilterForm)
  res.render('statistics/filter', { csrf: req.csrfToken(), dateFilterForm, anchor: anchors[req.body.filter_type ] })
}

const handlers = {
  overview,
  dateFilter,
  dateFilterRequest,
  compareFilter,
  compareFilterRequest,
  csvServices,
  byServices,
  filter,
  submitFilter
}
module.exports = wrapAsyncErrorHandlers(handlers)
