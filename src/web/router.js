// top level service router, responsible for matching paths with module controllers
// @TODO(sfount) this should be split up as the service grows
const express = require('express')
const passport = require('passport')
const multer = require('multer')

const auth = require('./../lib/auth')
const healthcheck = require('./../lib/healthcheck')

// module HTTP controllers
const landing = require('./modules/landing/landing.http')
const statistics = require('./modules/statistics/statistics.http')
const gatewayAccounts = require('./modules/gateway_accounts').default
const switchPSP = require('./modules/gateway_accounts/switch_psp/switch_psp.http')
const services = require('./modules/services').default
const discrepancies = require('./modules/discrepancies')
const stripe = require('./modules/stripe')
const transactions = require('./modules/transactions/transactions.http')
const agreements = require('./modules/agreements/agreements.http')
const webhooks = require('./modules/webhooks/webhooks.http')
const updateTransactions = require('./modules/transactions/update/update.http')
const parity = require('./modules/transactions/discrepancies/validateLedger.http')
const platform = require('./modules/platform/dashboard.http')
const paymentLinks = require('./modules/payment_links/payment_links.http')
const ledgerPayouts = require('./modules/ledger_payouts/payout.http')
const performance = require('./modules/statistics/performance.http')
const events = require('./modules/events')

// @TODO(sfount) remove `default`s on update to import export syntax
const users = require('./modules/users/users.http').default

const {PermissionLevel} = require('../lib/auth/types')

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({storage})

router.get('/auth', passport.authenticate('github'))
router.get('/auth/github/callback', (req, res, next) => {
  passport.authenticate('github', {
    failureRedirect: '/auth/unauthorised',
    successRedirect: req.session && req.session.authBlockedRedirectUrl || '/'
  })(req, res, next)
})
router.get('/auth/unauthorised', auth.unauthorised)

router.get('/', auth.secured(PermissionLevel.VIEW_ONLY), landing.root)

router.get('/statistics/services', auth.secured(PermissionLevel.VIEW_ONLY), statistics.csvServices)
router.post('/statistics/services', auth.secured(PermissionLevel.VIEW_ONLY), statistics.byServices)
router.get('/statistics/performance-page', auth.secured(PermissionLevel.VIEW_ONLY), performance.overview)
router.get('/statistics/performance-data', auth.secured(PermissionLevel.VIEW_ONLY), performance.downloadData)

router.get('/gateway_accounts', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.overview)
router.get('/gateway_accounts/csv', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.listCSV)
router.get('/gateway_accounts/csvWithAdminEmails', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.listCSVWithAdminEmails)
router.get('/gateway_accounts/create', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.create.http, gatewayAccounts.create.exceptions)
router.post('/gateway_accounts/create', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.writeAccount.http, gatewayAccounts.writeAccount.exceptions)
router.post('/gateway_accounts/create/confirm', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.confirm.http, gatewayAccounts.confirm.exceptions)
router.get('/gateway_accounts/search', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.search)
router.post('/gateway_accounts/search', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.searchRequest)
router.get('/gateway_accounts/:id', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.detail.http, gatewayAccounts.detail.exceptions)
router.get('/gateway_accounts/:id/api_keys', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.apiKeys)
router.get('/gateway_accounts/:accountId/api_keys/:tokenId/delete', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.deleteApiKey)
router.get('/gateway_accounts/:id/block_prepaid_cards/toggle', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.toggleBlockPrepaidCards)
router.get('/gateway_accounts/:id/surcharge', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.surcharge)
router.post('/gateway_accounts/:id/surcharge', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.updateSurcharge)
router.get('/gateway_accounts/:id/email_branding', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.emailBranding)
router.post('/gateway_accounts/:id/email_branding', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.updateEmailBranding)
router.post('/gateway_accounts/:id/toggle_moto_payments', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.toggleMotoPayments)
router.post('/gateway_accounts/:id/toggle_allow_telephone_payment_notifications', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.toggleAllowTelephonePaymentNotifications)
router.post('/gateway_accounts/:id/toggle_send_payer_ip_address_to_gateway', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.toggleSendPayerIpAddressToGateway)
router.post('/gateway_accounts/:id/toggle_send_payer_email_to_gateway', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.toggleSendPayerEmailToGateway)
router.post('/gateway_accounts/:id/toggle_worldpay_exemption_engine', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.toggleWorldpayExemptionEngine)
router.post('/gateway_accounts/:id/toggle_send_reference_to_gateway', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.toggleSendReferenceToGateway)
router.get('/gateway_accounts/:id/disable', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.disableReasonPage)
router.post('/gateway_accounts/:id/disable', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.disable)
router.post('/gateway_accounts/:id/enable', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.enable)
router.post('/gateway_accounts/:id/toggle_allow_authorisation_api', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.toggleAllowAuthorisationApi)
router.post('/gateway_accounts/:id/toggle_recurring_enabled', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.toggleRecurringEnabled)
router.get('/gateway_accounts/:id/stripe_statement_descriptor', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.updateStripeStatementDescriptorPage)
router.post('/gateway_accounts/:id/stripe_statement_descriptor', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.updateStripeStatementDescriptor)
router.get('/gateway_accounts/:id/stripe_payout_descriptor', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.updateStripePayoutDescriptorPage)
router.post('/gateway_accounts/:id/stripe_payout_descriptor', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.updateStripePayoutDescriptor)
router.get('/gateway_accounts/:id/agent_initiated_moto', auth.secured(PermissionLevel.VIEW_ONLY), gatewayAccounts.agentInitiatedMotoPage)
router.post('/gateway_accounts/:id/agent_initiated_moto', auth.secured(PermissionLevel.USER_SUPPORT), gatewayAccounts.createAgentInitiatedMotoProduct)
router.get('/gateway_accounts/:id/switch_psp', auth.secured(PermissionLevel.VIEW_ONLY), switchPSP.switchPSPPage)
router.post('/gateway_accounts/:id/switch_psp', auth.secured(PermissionLevel.USER_SUPPORT), switchPSP.postSwitchPSP)

router.get('/gateway_accounts/:accountId/payment_links', auth.secured(PermissionLevel.VIEW_ONLY), paymentLinks.list)
router.get('/gateway_accounts/:accountId/payment_links/csv', auth.secured(PermissionLevel.VIEW_ONLY), paymentLinks.listCSV)

router.get('/services', auth.secured(PermissionLevel.VIEW_ONLY), services.overview)
router.get('/services/csv', auth.secured(PermissionLevel.VIEW_ONLY), services.listCsv)
router.get('/services/performance_platform_csv', auth.secured(PermissionLevel.VIEW_ONLY), services.performancePlatformCsv)
router.get('/services/search', auth.secured(PermissionLevel.VIEW_ONLY), services.search)
router.post('/services/search', auth.secured(PermissionLevel.VIEW_ONLY), services.searchRequest)
router.get('/services/:id', auth.secured(PermissionLevel.VIEW_ONLY), services.detail.http, services.detail.exceptions)
router.get('/services/:id/branding', auth.secured(PermissionLevel.VIEW_ONLY), services.branding, services.detail.exceptions)
router.post('/services/:id/branding', auth.secured(PermissionLevel.ADMIN), services.updateBranding)
router.get('/services/:id/link_accounts', auth.secured(PermissionLevel.ADMIN), services.linkAccounts, services.detail.exceptions)
router.post('/services/:id/link_accounts', auth.secured(PermissionLevel.ADMIN), services.updateLinkAccounts.http, services.updateLinkAccounts.exceptions)
router.get('/services/:id/toggle_terminal_state_redirect', auth.secured(PermissionLevel.USER_SUPPORT), services.toggleTerminalStateRedirectFlag)
router.get('/services/:id/toggle_experimental_features_enabled', auth.secured(PermissionLevel.USER_SUPPORT), services.toggleExperimentalFeaturesEnabled)
router.get('/services/:id/toggle_agent_initiated_moto_enabled', auth.secured(PermissionLevel.USER_SUPPORT), services.toggleAgentInitiatedMotoEnabled)
router.get('/services/:id/toggle_archived_status', auth.secured(PermissionLevel.USER_SUPPORT), services.toggleArchiveService)
router.get('/services/:id/organisation', auth.secured(PermissionLevel.USER_SUPPORT), services.updateOrganisationForm)
router.post('/services/:id/organisation', auth.secured(PermissionLevel.USER_SUPPORT), services.updateOrganisation)

router.get('/discrepancies/search', auth.secured(PermissionLevel.USER_SUPPORT), discrepancies.search)
router.post('/discrepancies/search', auth.secured(PermissionLevel.USER_SUPPORT), discrepancies.getDiscrepancyReport)
router.post('/discrepancies/resolve/:id', auth.secured(PermissionLevel.USER_SUPPORT), discrepancies.resolveDiscrepancy)

router.get('/stripe/basic/create', auth.secured(PermissionLevel.VIEW_ONLY), stripe.basic)
router.post('/stripe/basic/create', auth.secured(PermissionLevel.USER_SUPPORT), stripe.basicCreate)
router.get('/stripe/basic/create-test-account', auth.secured(PermissionLevel.VIEW_ONLY), stripe.createTestAccount)
router.post('/stripe/basic/create-test-account', auth.secured(PermissionLevel.USER_SUPPORT), stripe.createTestAccountConfirm)

// @TODO(sfount) simple to integrate into table action - should be reconsidered for POST or PATCH
router.get('/users/search', auth.secured(PermissionLevel.VIEW_ONLY), users.searchPage)
router.post('/users/search', auth.secured(PermissionLevel.VIEW_ONLY), users.search)

router.get('/users/:id', auth.secured(PermissionLevel.VIEW_ONLY), users.show)
router.get('/users/:id/phone', auth.secured(PermissionLevel.USER_SUPPORT), users.updatePhoneNumberForm)
router.post('/users/:id/phone', auth.secured(PermissionLevel.USER_SUPPORT), users.updatePhoneNumber)
router.get('/users/:id/email', auth.secured(PermissionLevel.USER_SUPPORT), users.updateEmailForm)
router.post('/users/:id/email', auth.secured(PermissionLevel.USER_SUPPORT), users.updateEmail)

// @TODO(sfount) PATCH and DELETE respectively
router.get('/users/:id/toggle', auth.secured(PermissionLevel.USER_SUPPORT), users.toggleUserEnabled)
router.post('/users/:userId/service/:serviceId/delete', auth.secured(PermissionLevel.ADMIN), users.removeUserFromService)
router.get('/users/:userId/service/:serviceId/delete-confirm', auth.secured(PermissionLevel.USER_SUPPORT), users.confirmRemoveUserFromService)
router.get('/users/:id/2FA/reset', auth.secured(PermissionLevel.USER_SUPPORT), users.resetUserSecondFactor)

router.get('/transactions/search', auth.secured(PermissionLevel.VIEW_ONLY), transactions.searchPage)
router.post('/transactions/search', auth.secured(PermissionLevel.VIEW_ONLY), transactions.search)
router.get('/transactions/statistics', auth.secured(PermissionLevel.VIEW_ONLY), transactions.statistics)
router.get('/transactions/csv', auth.secured(PermissionLevel.VIEW_ONLY), transactions.csvPage)
router.post('/transactions/csv', auth.secured(PermissionLevel.VIEW_ONLY), transactions.streamCsv)
router.get('/transactions/update', auth.secured(PermissionLevel.VIEW_ONLY), updateTransactions.fileUpload)
router.post('/transactions/update', auth.secured(PermissionLevel.USER_SUPPORT), upload.single('transactions-file'), updateTransactions.update)
router.get('/transactions/update/success', auth.secured(PermissionLevel.USER_SUPPORT), updateTransactions.updateSuccess)
router.get('/transactions/:id', auth.secured(PermissionLevel.VIEW_ONLY), transactions.show)
router.get('/transactions/:id/parity', auth.secured(PermissionLevel.USER_SUPPORT), parity.validateLedgerTransaction)

router.get('/transactions', auth.secured(PermissionLevel.VIEW_ONLY), transactions.list)

router.get('/agreements/search', auth.secured(PermissionLevel.VIEW_ONLY), agreements.searchPage)
router.post('/agreements/search', auth.secured(PermissionLevel.VIEW_ONLY), agreements.search)
router.get('/agreements/:id', auth.secured(PermissionLevel.VIEW_ONLY), agreements.detail)
router.get('/agreements', auth.secured(PermissionLevel.VIEW_ONLY), agreements.list)

router.get('/payment_links', auth.secured(PermissionLevel.VIEW_ONLY), paymentLinks.list)
router.get('/payment_links/search', auth.secured(PermissionLevel.VIEW_ONLY), paymentLinks.search)
router.post('/payment_links/search', auth.secured(PermissionLevel.VIEW_ONLY), paymentLinks.searchRequest)
router.get('/payment_links/csv', auth.secured(PermissionLevel.VIEW_ONLY), paymentLinks.listCSV)
router.get('/payment_links/:id', auth.secured(PermissionLevel.VIEW_ONLY), paymentLinks.detail)
router.post('/payment_links/:id/toggle_require_captcha', auth.secured(PermissionLevel.USER_SUPPORT), paymentLinks.toggleRequireCaptcha)

router.get('/payouts', auth.secured(PermissionLevel.VIEW_ONLY), ledgerPayouts.list)

router.get('/webhooks/:id', auth.secured(PermissionLevel.VIEW_ONLY), webhooks.detail)
router.get('/webhooks', auth.secured(PermissionLevel.VIEW_ONLY), webhooks.list)

router.get('/platform/dashboard', auth.secured(PermissionLevel.VIEW_ONLY), platform.dashboard)
router.get('/platform/dashboard/live', platform.live)

router.get('/api/platform/timeseries', platform.timeseries)
router.get('/api/platform/aggregate', platform.aggregate)
router.get('/api/platform/ticker', platform.ticker)
router.get('/api/platform/services', platform.services)

router.get('/events', auth.secured(PermissionLevel.USER_SUPPORT), events.emitByIdPage)
router.post('/events/by_id', auth.secured(PermissionLevel.USER_SUPPORT), events.emitById)
router.get('/events-by-date', auth.secured(PermissionLevel.USER_SUPPORT), events.emitByDatePage)
router.post('/events/by_date', auth.secured(PermissionLevel.USER_SUPPORT), events.emitByDate)
router.get('/parity-checker', auth.secured(PermissionLevel.USER_SUPPORT), events.parityCheckerPage)
router.post('/parity-checker', auth.secured(PermissionLevel.USER_SUPPORT), events.parityCheck)

router.get('/logout', auth.secured(PermissionLevel.VIEW_ONLY), auth.revokeSession)

router.get('/healthcheck', healthcheck.response)

module.exports = router
