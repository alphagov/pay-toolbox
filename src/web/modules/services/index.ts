import * as exceptions from './services.exceptions'
import {
  branding,
  detail,
  linkAccounts,
  listCsv,
  overview,
  performancePlatformCsv,
  search,
  searchRequest,
  toggleAgentInitiatedMotoEnabledFlag,
  toggleArchiveService,
  toggleExperimentalFeaturesEnabledFlag,
  toggleTerminalStateRedirectFlag,
  updateBranding,
  updateLinkAccounts,
  updateOrganisation,
  updateOrganisationForm
} from './services.http'

export default {
  overview: overview,
  listCsv: listCsv,
  performancePlatformCsv: performancePlatformCsv,
  detail: {
    http: detail,
    exceptions: exceptions.detail
  },
  branding: branding,
  updateBranding: updateBranding,
  linkAccounts: linkAccounts,
  updateLinkAccounts: {
    http: updateLinkAccounts,
    exceptions: exceptions.updateLinkAccounts
  },
  search: search,
  searchRequest: searchRequest,
  toggleTerminalStateRedirectFlag: toggleTerminalStateRedirectFlag,
  toggleExperimentalFeaturesEnabled: toggleExperimentalFeaturesEnabledFlag,
  toggleAgentInitiatedMotoEnabled: toggleAgentInitiatedMotoEnabledFlag,
  updateOrganisationForm: updateOrganisationForm,
  updateOrganisation: updateOrganisation,
  toggleArchiveService: toggleArchiveService
}
