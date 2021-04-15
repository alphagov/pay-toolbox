import { Request, Response } from 'express'
import moment from 'moment'
import { Service } from '../../../lib/pay-request/types/adminUsers'
import { getLiveNotArchivedServices } from '../services/getFilteredServices'

export async function overview(req: Request, res: Response) {
  res.render('statistics/performancePage')
}

export async function downloadData(req: Request, res: Response) {
  const services = await getLiveNotArchivedServices()
  const countBySector = services.reduce((aggregate: { [key: string]: number; }, service: Service) => {
    if (service.sector) {
      const sector = service.sector.replace(' ', '')
      aggregate[sector] = aggregate[sector] + 1 || 1
    }
    return aggregate
  }, {})
  const countByOrganisation = services
    .reduce((aggregate: { [key: string]: number; }, service: Service) => {
      const org = service.merchant_details && service.merchant_details.name
      if (org) {
        aggregate[org] = aggregate[org] + 1 || 1
      }
      return aggregate
    }, {})
  const orderedCountByOrganisation = Object.keys(countByOrganisation)
    .sort()
    .reduce((aggregate: { [key: string]: number; }, organisation: string) => {
      aggregate[organisation] = countByOrganisation[organisation]
      return aggregate
    }, {})

  const data = {
    dateUpdated: moment().format('D MMMM YYYY'),
    numberOfPayments: 'GET_DATA_FROM_QUERY',
    totalPaymentAmount: 'GET_DATA_FROM_QUERY',
    numberOfServices: services.length,
    numberOfOrganisations: Object.keys(orderedCountByOrganisation).length,
    serviceCountBySector: countBySector,
    serviceCountByOrganisation: orderedCountByOrganisation
  }

  res.set('Content-Type', 'application/json')
  res.set('Content-Disposition', `attachment; filename="performance.json"`)
  res.status(200).send(JSON.stringify(data, null, 2))
}