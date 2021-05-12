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
const services = require('./modules/services').default
const charges = require('./modules/transactions/legacy')
const discrepancies = require('./modules/discrepancies')
const stripe = require('./modules/stripe')
const payouts = require('./modules/payouts/payouts.http')
const transactions = require('./modules/transactions/transactions.http')
const updateTransactions = require('./modules/transactions/update/update.http')
const parity = require('./modules/transactions/discrepancies/validateLedger.http')
const platform = require('./modules/platform/dashboard.http')
const paymentLinks = require('./modules/payment_links/payment_links.http')
const ledgerPayouts = require('./modules/ledger_payouts/payout.http')
const performance = require('./modules/statistics/performance.http')
const events = require('./modules/events')

// @TODO(sfount) remove `default`s on update to import export syntax
const users = require('./modules/users/users.http').default

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({ storage })

router.get('/auth', passport.authenticate('github'))
router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/auth/unauthorised', successRedirect: '/' }))
router.get('/auth/unauthorised', auth.unauthorised)

router.get('/', auth.secured, landing.root)

router.get('/statistics', auth.secured, statistics.overview)
router.get('/statistics/filter/date', auth.secured, statistics.dateFilterRequest)
router.post('/statistics/filter/date', auth.secured, statistics.dateFilter)
router.get('/statistics/compare/date', auth.secured, statistics.compareFilterRequest)
router.post('/statistics/compare/date', auth.secured, statistics.compareFilter)
router.get('/statistics/services', auth.secured, statistics.csvServices)
router.post('/statistics/services', auth.secured, statistics.byServices)
router.get('/statistics/performance-page', auth.secured, performance.overview)
router.get('/statistics/performance-data', auth.secured, performance.downloadData)

router.get('/gateway_accounts', auth.secured, gatewayAccounts.overview)
router.get('/gateway_accounts/csv', auth.secured, gatewayAccounts.listCSV)
router.get('/gateway_accounts/csvWithAdminEmails', auth.secured, gatewayAccounts.listCSVWithAdminEmails)
router.get('/gateway_accounts/direct_debit', auth.secured, gatewayAccounts.overviewDirectDebit)
router.get('/gateway_accounts/create', auth.secured, gatewayAccounts.create.http, gatewayAccounts.create.exceptions)
router.get('/gateway_accounts/search', auth.secured, gatewayAccounts.search)
router.post('/gateway_accounts/search', auth.secured, gatewayAccounts.searchRequest)
router.get('/gateway_accounts/:id', auth.secured, gatewayAccounts.detail.http, gatewayAccounts.detail.exceptions)
router.get('/gateway_accounts/:id/api_keys', auth.secured, gatewayAccounts.apiKeys)
router.get('/gateway_accounts/:accountId/api_keys/:tokenId/delete', auth.secured, gatewayAccounts.deleteApiKey)
router.post('/gateway_accounts/create', auth.secured, gatewayAccounts.writeAccount.http, gatewayAccounts.writeAccount.exceptions)
router.post('/gateway_accounts/create/confirm', auth.secured, gatewayAccounts.confirm.http, gatewayAccounts.confirm.exceptions)
router.get('/gateway_accounts/:id/block_prepaid_cards/toggle', auth.secured, gatewayAccounts.toggleBlockPrepaidCards)
router.get('/gateway_accounts/:id/surcharge', auth.secured, gatewayAccounts.surcharge)
router.post('/gateway_accounts/:id/surcharge', auth.secured, gatewayAccounts.updateSurcharge)
router.get('/gateway_accounts/:id/email_branding', auth.secured, gatewayAccounts.emailBranding)
router.post('/gateway_accounts/:id/email_branding', auth.secured, gatewayAccounts.updateEmailBranding)
router.post('/gateway_accounts/:id/toggle_moto_payments', auth.secured, gatewayAccounts.toggleMotoPayments)
router.post('/gateway_accounts/:id/toggle_allow_telephone_payment_notifications', auth.secured, gatewayAccounts.toggleAllowTelephonePaymentNotifications)
router.post('/gateway_accounts/:id/toggle_worldpay_exemption_engine', auth.secured, gatewayAccounts.toggleWorldpayExemptionEngine)
router.get('/gateway_accounts/:id/stripe_statement_descriptor', auth.secured, gatewayAccounts.updateStripeStatementDescriptorPage)
router.post('/gateway_accounts/:id/stripe_statement_descriptor', auth.secured, gatewayAccounts.updateStripeStatementDescriptor)
router.get('/gateway_accounts/:id/stripe_payout_descriptor', auth.secured, gatewayAccounts.updateStripePayoutDescriptorPage)
router.post('/gateway_accounts/:id/stripe_payout_descriptor', auth.secured, gatewayAccounts.updateStripePayoutDescriptor)
router.get('/gateway_accounts/:id/agent_initiated_moto', auth.secured, gatewayAccounts.agentInitiatedMotoPage)
router.post('/gateway_accounts/:id/agent_initiated_moto', auth.secured, gatewayAccounts.createAgentInitiatedMotoProduct)

router.get('/gateway_accounts/:accountId/payment_links', auth.secured, paymentLinks.list)
router.get('/gateway_accounts/:accountId/payment_links/csv', auth.secured, paymentLinks.listCSV)

router.get('/services', auth.secured, services.overview)
router.get('/services/csv', auth.secured, services.listCsv)
router.get('/services/performance_platform_csv', auth.secured, services.performancePlatformCsv)
router.get('/services/search', auth.secured, services.search)
router.post('/services/search', auth.secured, services.searchRequest)
router.get('/services/:id', auth.secured, services.detail.http, services.detail.exceptions)
router.get('/services/:id/branding', auth.secured, services.branding, services.detail.exceptions)
router.post('/services/:id/branding', auth.secured, auth.administrative, services.updateBranding)
router.get('/services/:id/link_accounts', auth.secured, auth.administrative, services.linkAccounts, services.detail.exceptions)
router.post('/services/:id/link_accounts', auth.secured, auth.administrative, services.updateLinkAccounts.http, services.updateLinkAccounts.exceptions)
router.get('/services/:id/toggle_terminal_state_redirect', auth.secured, services.toggleTerminalStateRedirectFlag)
router.get('/services/:id/toggle_experimental_features_enabled', auth.secured, services.toggleExperimentalFeaturesEnabled)
router.get('/services/:id/toggle_agent_initiated_moto_enabled', auth.secured, services.toggleAgentInitiatedMotoEnabled)
router.get('/services/:id/toggle_archived_status', auth.secured, services.toggleArchiveService)
router.get('/services/:id/organisation', auth.secured, services.updateOrganisationForm)
router.post('/services/:id/organisation', auth.secured, services.updateOrganisation)

router.get('/services/:serviceId/gateway_account/:gatewayAccountId/payouts', auth.secured, payouts.show)
router.get('/services/:serviceId/gateway_account/:gatewayAccountId/payouts/csv', auth.secured, payouts.listPayoutsCsv)
router.get('/services/:serviceId/gateway_account/:gatewayAccountId/payouts/:payoutId', auth.secured, payouts.csv)

router.get('/discrepancies/search', auth.secured, discrepancies.search)
router.post('/discrepancies/search', auth.secured, discrepancies.getDiscrepancyReport)
router.post('/discrepancies/resolve/:id', auth.secured, discrepancies.resolveDiscrepancy)

router.get('/charges/search', auth.secured, charges.search)
router.post('/charges/search', auth.secured, charges.searchTransaction.http, charges.searchTransaction.exceptions)

router.get('/stripe/basic/create', auth.secured, stripe.basic)
router.post('/stripe/basic/create', auth.secured, stripe.basicCreate)
router.get('/stripe/basic/create-test-account', auth.secured, stripe.createTestAccount)
router.post('/stripe/basic/create-test-account', auth.secured, stripe.createTestAccountConfirm)

// @TODO(sfount) simple to integrate into table action - should be reconsidered for POST or PATCH
router.get('/users/search', auth.secured, users.searchPage)
router.post('/users/search', auth.secured, users.search)

router.get('/users/:id', auth.secured, users.show)
router.get('/users/:id/phone', auth.secured, users.updatePhoneNumberForm)
router.post('/users/:id/phone', auth.secured, users.updatePhoneNumber)
router.get('/users/:id/email', auth.secured, users.updateEmailForm)
router.post('/users/:id/email', auth.secured, users.updateEmail)

// @TODO(sfount) PATCH and DELETE respectively
router.get('/users/:id/toggle', auth.secured, users.toggleUserEnabled)
router.get('/users/:userId/service/:serviceId/delete', auth.secured, users.removeUserFromService)
router.get('/users/:id/2FA/reset', auth.secured, users.resetUserSecondFactor)

router.get('/transactions/search', auth.secured, transactions.searchPage)
router.post('/transactions/search', auth.secured, transactions.search)
router.get('/transactions/statistics', auth.secured, transactions.statistics)
router.get('/transactions/csv', auth.secured, transactions.csvPage)
router.post('/transactions/csv', auth.secured, transactions.streamCsv)
router.get('/transactions/update', auth.secured, updateTransactions.fileUpload)
router.post('/transactions/update', auth.secured, upload.single('transactions-file'), updateTransactions.update)
router.get('/transactions/update/success', auth.secured, updateTransactions.updateSuccess)
router.get('/transactions/:id', auth.secured, transactions.show)
router.get('/transactions/:id/parity', auth.secured, parity.validateLedgerTransaction)

router.get('/transactions', auth.secured, transactions.list)

router.get('/payment_links', auth.secured, paymentLinks.list)
router.get('/payment_links/csv', auth.secured, paymentLinks.listCSV)

router.get('/payouts', auth.secured, ledgerPayouts.list)

router.get('/platform/dashboard', auth.secured, platform.dashboard)
router.get('/platform/dashboard/live', platform.live)

router.get('/api/platform/timeseries', platform.timeseries)
router.get('/api/platform/aggregate', platform.aggregate)
router.get('/api/platform/ticker', platform.ticker)
router.get('/api/platform/services', platform.services)

router.get('/events', auth.secured, events.emitByIdPage)
router.post('/events/by_id', auth.secured, events.emitById)
router.get('/events-by-date', auth.secured, events.emitByDatePage)
router.post('/events/by_date', auth.secured, events.emitByDate)
router.get('/parity-checker', auth.secured, events.parityCheckerPage)
router.post('/parity-checker', auth.secured, events.parityCheck)

router.get('/logout', auth.secured, auth.revokeSession)

router.get('/healthcheck', healthcheck.response)

module.exports = router
