import {NextFunction, Request, Response} from 'express'

import moment from 'moment'
import _ from 'lodash'
import logger from '../../../lib/logger'
import {AdminUsers, Connector, Ledger} from './../../../lib/pay-request/typed_clients/client'

import {wrapAsyncErrorHandlers} from './../../../lib/routes'
import {GatewayAccount} from "../../../lib/pay-request/typed_clients/services/connector/types";
import {AccountType} from "../../../lib/pay-request/typed_clients/shared";
import {GatewayPerformanceReportEntry} from "../../../lib/pay-request/typed_clients/services/ledger/types";
import {format} from "./csv"

const startOfGovUkPay = moment.utc().month(8).year(2016)

const csvServices = async function csvServices(req: Request, res: Response) {
  res.render('statistics/by_gateway_csv', {csrf: req.csrfToken()})
}

function getMonthsForReport(fromDate: moment.Moment, toDate: moment.Moment) {
  const compareDate = fromDate.clone()
  const yearMonthValues = []

  do {
    const key = compareDate.format('YYYY-MM')
    yearMonthValues.push(key)
    compareDate.add(1, 'month')
  } while (compareDate.isBefore(toDate))
  return yearMonthValues;
}

const byServices = async function byServices(req: Request, res: Response, next: NextFunction) {
  const {options} = req.body
  const forAllTime = options === 'all'
  const fromDate = forAllTime ? startOfGovUkPay : moment.utc().startOf('month')
  const toDate = moment.utc().endOf('month')

  logger.info(`Transaction volumes by gateway account for ${toDate.diff(fromDate, 'days')} days`, {
    from_date: fromDate.format('YYYY-MM-DD'),
    to_date: toDate.format('YYYY-MM-DD'),
    number_of_days: toDate.diff(fromDate, 'days')
  })

  try {
    const [gatewayAccountsResponse, services, gatewayPerformanceReport] = await Promise.all([
      Connector.accounts.list(),
      AdminUsers.services.list(),
      Ledger.reports.retrievePerformanceSummaryByGateway({
        from_date: fromDate.format("YYYY-MM-DD"),
        to_date: toDate.format("YYYY-MM-DD")
      })
    ])
    const accountsIndexedById = gatewayAccountsResponse.accounts.reduce((aggregate: { [key: string]: GatewayAccount }, account) => {
      aggregate[account.gateway_account_id] = account
      return aggregate
    }, {})
    const accountStatsByIdAndMonth = gatewayPerformanceReport.reduce((aggregate: { [key: string]: { [key: string]: GatewayPerformanceReportEntry } }, entry) => {
      const zeroIndexedMonth = Number(entry.month) - 1
      const monthKey = moment().utc().year(entry.year).month(zeroIndexedMonth).format('YYYY-MM')
      _.set(aggregate, `${entry.gateway_account_id}.${monthKey}`, entry)
      return aggregate
    }, {})

    const yearMonthValues = getMonthsForReport(fromDate, toDate);

    const reportData: object[] = []
    services
      .filter(service => !service.internal && !service.archived)
      .forEach(service => {
        service.gateway_account_ids
          .map(accountId => accountsIndexedById[accountId])
          .filter(account => account.type === AccountType.Live)
          .forEach(account => {
            const accountReportData: any = {
              gateway_account_id: account.gateway_account_id,
              service_name: (service.service_name && service.service_name.en) || account.service_name,
              description: account.description,
              organisation_name: (service.merchant_details && service.merchant_details.name) || '',
              payment_provider: account.payment_provider,
              sector: service.sector,
              went_live_date: service.went_live_date && moment(service.went_live_date).format('YYYY-MM-DD') || ''
            }

            yearMonthValues.forEach(month => {
              const accountStats = accountStatsByIdAndMonth[account.gateway_account_id] && accountStatsByIdAndMonth[account.gateway_account_id][month]
              const volume = accountStats && accountStats.total_volume || 0
              accountReportData[month] = volume
              if (forAllTime && !accountReportData.starting_month && volume > 0) {
                accountReportData.starting_month = month
              }
            })
            reportData.push(accountReportData)
          })
      })
    const ordered = _.sortBy(reportData, ['gateway_account_id'] )

    res.set('Content-Type', 'text/csv')
    res.set('Content-Disposition', `attachment; filename="GOVUK_Pay_platform_transactions_by_service_month_${fromDate.format('YYYY-MM')}_${toDate.format('YYYY-MM')}.csv"`)
    res.status(200).send(format(ordered, yearMonthValues, forAllTime))
  } catch (error) {
    next(error)
  }
}

const handlers = {
  csvServices,
  byServices
}
module.exports = wrapAsyncErrorHandlers(handlers)
