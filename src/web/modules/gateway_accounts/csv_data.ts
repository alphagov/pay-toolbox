/* eslint-disable @typescript-eslint/no-explicit-any */
import { AdminUsers, Connector } from '../../../lib/pay-request'
import { Service } from '../../../lib/pay-request/types/adminUsers'
import { aggregateServicesByGatewayAccountId, extractFiltersFromQuery, toAccountSearchParams, Filters } from '../../../lib/gatewayAccounts'
import { GatewayAccount } from '../../../lib/pay-request/types/connector'

async function getServiceGatewayAccountIndex(): Promise<{ [key: string]: Service }> {
  const services = await AdminUsers.services()
  return aggregateServicesByGatewayAccountId(services)
}

function getAccounts(filters: Filters): Promise<GatewayAccount[]> {
  const searchParams = toAccountSearchParams(filters)
  return Connector.accounts(searchParams).then((response: any) => response.accounts)
}

export async function createCsvData(filters: Filters): Promise<any> {
  const accountsResponse = await getAccounts(filters)
  const serviceGatewayAccountIndex = await getServiceGatewayAccountIndex() 

  return accountsResponse
    .filter((account: GatewayAccount) => serviceGatewayAccountIndex[account.gateway_account_id] != undefined)
    .map((account: GatewayAccount) => {
      const service = serviceGatewayAccountIndex[account.gateway_account_id]
      return {
        account,
        service,
        payment_email_enabled: account.email_notifications['PAYMENT_CONFIRMED'] && account.email_notifications['PAYMENT_CONFIRMED'].enabled || false,
        refund_email_emailed: account.email_notifications['REFUND_ISSUED'] && account.email_notifications['REFUND_ISSUED'].enabled || false,
        custom_branding: service.custom_branding !== undefined,
        email_branding: account.notify_settings !== undefined,
        corporate_surcharge: account.corporate_prepaid_credit_card_surcharge_amount
          + account.corporate_prepaid_debit_card_surcharge_amount
          + account.corporate_credit_card_surcharge_amount
          + account.corporate_debit_card_surcharge_amount !== 0
      }
    })
}

export async function createCsvWithAdminEmailsData(filters: Filters): Promise<any> {
  const accountsResponse = await getAccounts(filters)
  const serviceGatewayAccountIndex = await getServiceGatewayAccountIndex()
  const gatewayAccountToAdminEmails: { [key: string]: string[] } = 
    await AdminUsers.adminEmailsForGatewayAccounts(accountsResponse.map((account: GatewayAccount) => account.gateway_account_id))
  const gatewayAccountIndex = accountsResponse.reduce((aggregate: any, account: GatewayAccount) => {
    aggregate[account.gateway_account_id] = account
    return aggregate
  }, {})

  const emailAccountService: any[] = []

  Object.entries(gatewayAccountToAdminEmails).forEach(([gatewayAccountId, emails]) => {
    const service = serviceGatewayAccountIndex[gatewayAccountId]
    const account = gatewayAccountIndex[gatewayAccountId]
    emails.forEach(email => {
      emailAccountService.push({email,service,account})
    })
  })

  return emailAccountService
    .map(({email,service,account}) => {
      return {
        email,
        account,
        service,
        payment_email_enabled: account.email_notifications['PAYMENT_CONFIRMED'] && account.email_notifications['PAYMENT_CONFIRMED'].enabled || false,
        refund_email_emailed: account.email_notifications['REFUND_ISSUED'] && account.email_notifications['REFUND_ISSUED'].enabled || false,
        custom_branding: service.custom_branding !== undefined,
        email_branding: account.notify_settings !== undefined,
        corporate_surcharge: account.corporate_prepaid_credit_card_surcharge_amount
          + account.corporate_prepaid_debit_card_surcharge_amount
          + account.corporate_credit_card_surcharge_amount
          + account.corporate_debit_card_surcharge_amount !== 0
      }
    })
}
