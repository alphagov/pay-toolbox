import http from './gateway_accounts.http'
import exceptions from './gateway_accounts.exceptions'
import {
  agentInitiatedMoto,
  agentInitiatedMotoProduct,
  createAgentInitiatedMotoProduct,
  motoSettings, toggleAgentInitiatedMotoEnabledFlag,
  toggleAllowAuthorisationApi, toggleAllowTelephonePaymentNotifications, toggleMotoPayments
} from "./moto.http";

export default {
  overview: http.overview,
  listCSV: http.listCSV,
  listCSVWithAdminEmails: http.listCSVWithAdminEmails,
  create: {
    http: http.create,
    exceptions: exceptions.create
  },
  confirm: {
    http: http.confirm,
    exceptions: exceptions.confirm
  },
  writeAccount: {
    http: http.writeAccount,
    exceptions: exceptions.writeAccount
  },
  detail: {
    http: http.detail,
    exceptions: exceptions.detail
  },
  apiKeys: http.apiKeys,
  deleteApiKey: http.deleteApiKey,
  surcharge: http.surcharge,
  updateSurcharge: http.updateSurcharge,
  emailBranding: http.emailBranding,
  updateEmailBranding: http.updateEmailBranding,
  blockPrepaidCards: http.blockPrepaidCards,
  updateBlockPrepaidCards: http.updateBlockPrepaidCards,
  toggleSendPayerIpAddressToGateway: http.toggleSendPayerIpAddressToGateway,
  toggleSendPayerEmailToGateway: http.toggleSendPayerEmailToGateway,
  toggleSendReferenceToGateway: http.toggleSendReferenceToGateway,
  disableReasonPage: http.disableReasonPage,
  disable: http.disable,
  enable: http.enable,
  updateStripeStatementDescriptorPage: http.updateStripeStatementDescriptorPage,
  updateStripeStatementDescriptor: http.updateStripeStatementDescriptor,
  updateStripePayoutDescriptorPage: http.updateStripePayoutDescriptorPage,
  updateStripePayoutDescriptor: http.updateStripePayoutDescriptor,
  search: http.search,
  searchRequest: http.searchRequest,
  toggleWorldpayExemptionEngine: http.toggleWorldpayExemptionEngine,
  toggleRecurringEnabled: http.toggleRecurringEnabled,
  motoSettings: motoSettings,
  toggleMotoPayments: toggleMotoPayments,
  agentInitiatedMoto: agentInitiatedMoto,
  agentInitiatedMotoProduct: agentInitiatedMotoProduct,
  createAgentInitiatedMotoProduct: createAgentInitiatedMotoProduct,
  toggleAgentInitiatedMotoEnabledFlag: toggleAgentInitiatedMotoEnabledFlag,
  toggleAllowTelephonePaymentNotifications: toggleAllowTelephonePaymentNotifications,
  toggleAllowAuthorisationApi: toggleAllowAuthorisationApi

}
