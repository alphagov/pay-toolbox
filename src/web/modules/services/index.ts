import http from './services.http'
import * as exceptions from './services.exceptions'

export default {
  overview: http.overview,
  listCsv: http.listCsv,
  performancePlatformCsv: http.performancePlatformCsv,
  detail: {
    http: http.detail,
    exceptions: exceptions.detail
  },
  branding: http.branding,
  updateBranding: http.updateBranding,
  linkAccounts: http.linkAccounts,
  updateLinkAccounts: {
    http: http.updateLinkAccounts,
    exceptions: exceptions.updateLinkAccounts
  },
  search: http.search,
  searchRequest: http.searchRequest,
  toggleTerminalStateRedirectFlag: http.toggleTerminalStateRedirectFlag,
  toggleExperimentalFeaturesEnabled: http.toggleExperimentalFeaturesEnabledFlag,
  toggleAgentInitiatedMotoEnabled: http.toggleAgentInitiatedMotoEnabled,
  updateOrganisationForm: http.updateOrganisationForm,
  updateOrganisation: http.updateOrganisation
}
