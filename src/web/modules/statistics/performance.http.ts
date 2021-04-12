import { Request, Response } from 'express'
import moment from 'moment'
import { Service } from '../../../lib/pay-request/types/adminUsers'
import { getLiveNotArchivedServices } from '../services/getFilteredServices'

export async function overview(req: Request, res: Response) {
  res.render('statistics/performancePage')
}

export async function getPerformancePageHtml(req: Request, res: Response) {
  const services = await getLiveNotArchivedServices()
  const countBySector = services.reduce((aggregate: { [key: string]: number; }, service: Service) => {
    const sector = service.sector
    aggregate[sector] = aggregate[sector] + 1 || 1
    return aggregate
  }, {})
  const countByOrganisation = services.reduce((aggregate: { [key: string]: number; }, service: Service) => {
    const org = service.merchant_details && service.merchant_details.name
    if (org) {
      aggregate[org] = aggregate[org] + 1 || 1
    }
    return aggregate
  }, {})

  const organisationTableRows = Object.keys(countByOrganisation).sort().reduce((aggregate: string, organisation: string) => {
    const count = countByOrganisation[organisation]
    return aggregate + `<tr class="govuk-table__row">
    <td class="govuk-table__cell">
        ${organisation}
    </td>
    <td class="govuk-table__cell">${count}</td>
</tr>
`
  }, '')

  const numberOfOrganisations = Object.keys(countByOrganisation).length
  const date = moment().format('D MMMM YYYY')

  const html = `<main class="govuk-main-wrapper govuk-!-margin-top-4">
  <div class="govuk-grid-row  govuk-!-margin-bottom-4">
      <div class="govuk-grid-column-two-thirds">
          <h1 class="govuk-heading-l">Performance data</h1>
      </div>
  </div>

  <div class="govuk-grid-row govuk-!-margin-bottom-4">
      <div class="govuk-grid-column-full">
          <h2 class="govuk-heading-m">
              Since September 2016
          </h2>
      </div>
  </div>

  <div class="govuk-grid-row govuk-!-margin-bottom-4">
      <div class="govuk-grid-column-one-third">
          <div class="govuk-heading-xl govuk-!-margin-bottom-0">${services.length}</div>
          <div class="govuk-body">live services</div>
      </div>
      <div class="govuk-grid-column-one-third">
          <div class="govuk-heading-xl govuk-!-margin-bottom-0">X million</div>
          <div class="govuk-body">total transactions processed</div>
      </div>
      <div class="govuk-grid-column-one-third">
          <div class="govuk-heading-xl govuk-!-margin-bottom-0">&#163; X million</div>
          <div class="govuk-body">total amount processed by Pay</div>
      </div>
  </div>

  <div class="govuk-grid-row">
      <div class="govuk-grid-column-full">
          <div class="govuk-body-s">Last updated: ${date}</div>
      </div>
  </div>

  <div class="product-page-!-border-bottom govuk-!-margin-bottom-8"></div>

  <div class="govuk-grid-row">
      <div class="govuk-grid-column-full">
          <table class="govuk-table govuk-!-margin-bottom-9">
              <caption class="govuk-visually-hidden">Sectors using pay</caption>
              <thead class="govuk-table__head">
              <tr class="govuk-table__row">
                  <th scope="col" class="govuk-table__header">Sector type</th>
                  <th scope="col" class="govuk-table__header">Number of live services</th>
              </tr>
              </thead>
              <tbody class="govuk-table__body">
              <tr class="govuk-table__row">
                  <td class="govuk-table__cell">Central government, including devolved administrations, arms length
                      bodies
                      and executive agencies
                  </td>
                  <td class="govuk-table__cell">${countBySector['central']}</td>
              </tr>
              <tr class="govuk-table__row">
                  <td class="govuk-table__cell">Local government</td>
                  <td class="govuk-table__cell">${countBySector['local']}</td>
              </tr>
              <tr class="govuk-table__row">
                  <td class="govuk-table__cell">Central NHS</td>
                  <td class="govuk-table__cell">${countBySector['nhs central']}</td>
              </tr>

              <tr class="govuk-table__row">
                  <td class="govuk-table__cell">NHS Trust</td>
                  <td class="govuk-table__cell">${countBySector['nhs trust']}</td>
              </tr>
              <tr class="govuk-table__row">
                  <td class="govuk-table__cell">Police</td>
                  <td class="govuk-table__cell">${countBySector['police']}</td>
              </tr>
              </tbody>
          </table>
      </div>
  </div>

  <div class="govuk-grid-row">
      <div class="govuk-grid-column-full">
          <h2 class="govuk-heading-m">Organisations using GOV.UK Pay</h2>
      </div>
  </div>

  <div class="govuk-grid-row">
      <div class="govuk-grid-column-one-half">
          <span class="govuk-visually-hidden">There are</span>
          <div class="govuk-heading-xl govuk-!-margin-bottom-0">${numberOfOrganisations}</div>
          <div class="govuk-body">organisations</div>
      </div>
      <div class="govuk-grid-column-one-half">
          <span class="govuk-visually-hidden">and</span>
          <div class="govuk-heading-xl govuk-!-margin-bottom-0">${services.length}</div>
          <div class="govuk-body">services</div>
      </div>
  </div>

  <div class="govuk-grid-row">
      <div class="govuk-grid-column-full">
          <table class="govuk-table govuk-!-margin-top-4">
              <caption class="govuk-visually-hidden">Live services per organisation</caption>
              <thead class="govuk-table__head">
              <tr class="govuk-table__row">
                  <th scope="col" class="govuk-table__header">Organisations</th>
                  <th scope="col" class="govuk-table__header">Number of live services</th>
              </tr>
              </thead>
              <tbody class="govuk-table__body">
                ${organisationTableRows}
              </tbody>
          </table>
      </div>
  </div>
</main>
`

  res.writeHead(200, {
    'Content-Type': 'text/plain',
    'Content-Length': html.length,
  });
  res.end(html)
}