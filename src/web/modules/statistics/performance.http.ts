import {Request, Response} from 'express'
import moment from 'moment'
import {Service} from '../../../lib/pay-request/services/admin_users/types'
import {getLiveNotArchivedServices} from '../services/getFilteredServices'
import {Ledger} from '../../../lib/pay-request/client'
import {TransactionState} from "../../../lib/pay-request/shared";

function convertToUnits(value: number) {
  let stringOfAmount

  if (value >= 1000000 && value < 1000000000) {
    stringOfAmount = (value / 1.0e6).toFixed(1) + " million";
  } else if (value >= 10000000) {
    stringOfAmount = (value / 1.0e9).toFixed(1) + " billion";
  } else
    stringOfAmount = value.toString()

  return stringOfAmount;
}

export async function overview(req: Request, res: Response) {
  res.render('statistics/performancePage')
}

export async function downloadData(req: Request, res: Response) {
  const services = await getLiveNotArchivedServices()
  const countBySector = services.reduce((aggregate: Record<string, number>, service: Service) => {
    if (service.sector) {
      const sector = service.sector.replace(' ', '')
      aggregate[sector] = aggregate[sector] + 1 || 1
    }
    return aggregate
  }, {})
  const countByOrganisation = services
    .reduce((aggregate: Record<string, number>, service: Service) => {
      const org = service.merchant_details?.name
      if (org) {
        aggregate[org] = aggregate[org] + 1 || 1
      }
      return aggregate
    }, {})
  const orderedCountByOrganisation = Object.keys(countByOrganisation)
    .sort()
    .reduce((aggregate: Record<string, number>, organisation: string) => {
      aggregate[organisation] = countByOrganisation[organisation]
      return aggregate
    }, {})

  const paymentStatistics = await Ledger.reports.retrievePerformanceSummary({
    state: TransactionState.Success
  })

  const data = {
    dateUpdated: moment().format('D MMMM YYYY'),
    numberOfPayments: convertToUnits(paymentStatistics.total_volume),
    totalPaymentAmount: convertToUnits(paymentStatistics.total_amount / 100),
    numberOfServices: services.length,
    numberOfOrganisations: Object.keys(orderedCountByOrganisation).length,
    serviceCountBySector: countBySector,
    serviceCountByOrganisation: orderedCountByOrganisation
  }

  res.set('Content-Type', 'application/json')
  res.set('Content-Disposition', `attachment; filename="performance.json"`)
  res.status(200).send(JSON.stringify(data, null, 2))
}
