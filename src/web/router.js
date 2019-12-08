// top level service router, responsible for matching paths with module controllers
// @TODO(sfount) this should be split up as the service grows
const express = require('express')
const passport = require('passport')

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
const parity = require('./modules/transactions/discrepancies/validateLedger.http')
const platform = require('./modules/platform/dashboard.http')

// @TODO(sfount) remove `default`s on update to import export syntax
const users = require('./modules/users/users.http').default

const router = express.Router()

router.get('/auth', passport.authenticate('github'))
router.get('/auth/github/callback', passport.authenticate('github', { failureRedirect: '/auth/unauthorised', successRedirect: '/' }))
router.get('/auth/unauthorised', auth.unauthorised)

router.get('/', auth.secured, landing.root)

router.get('/statistics', auth.secured, statistics.overview)
router.get('/statistics/filter/date', auth.secured, statistics.dateFilterRequest)
router.post('/statistics/filter/date', auth.secured, statistics.dateFilter)
router.get('/statistics/compare/date', auth.secured, statistics.compareFilterRequest)
router.post('/statistics/compare/date', auth.secured, statistics.compareFilter)
router.get('/statistics/services', auth.secured, statistics.byServices)

router.get('/gateway_accounts', auth.secured, gatewayAccounts.overview)
router.get('/gateway_accounts/direct_debit', auth.secured, gatewayAccounts.overviewDirectDebit)
router.get('/gateway_accounts/create', auth.secured, gatewayAccounts.create.http, gatewayAccounts.create.exceptions)
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

router.get('/services', auth.secured, services.overview)
router.get('/services/search', auth.secured, services.search)
router.post('/services/search', auth.secured, services.searchRequest)
router.get('/services/:id', auth.secured, services.detail.http, services.detail.exceptions)
router.get('/services/:id/branding', auth.secured, services.branding, services.detail.exceptions)
router.post('/services/:id/branding', auth.secured, auth.administrative, services.updateBranding)
router.get('/services/:id/link_accounts', auth.secured, auth.administrative, services.linkAccounts, services.detail.exceptions)
router.post('/services/:id/link_accounts', auth.secured, auth.administrative, services.updateLinkAccounts.http, services.updateLinkAccounts.exceptions)
router.get('/services/:id/toggle_terminal_state_redirect', auth.secured, services.toggleTerminalStateRedirectFlag)

router.get('/services/:serviceId/gateway_account/:gatewayAccountId/payouts', auth.secured, payouts.show)
router.get('/services/:serviceId/gateway_account/:gatewayAccountId/payouts/csv', auth.secured, payouts.listPayoutsCsv)
router.get('/services/:serviceId/gateway_account/:gatewayAccountId/payouts/:payoutId', auth.secured, payouts.csv)

router.get('/discrepancies/search', auth.secured, discrepancies.search)
router.post('/discrepancies/search', auth.secured, discrepancies.getDiscrepancyReport)
router.post('/discrepancies/resolve/:id', auth.secured, discrepancies.resolveDiscrepancy)

router.get('/charges/search', auth.secured, charges.search)
router.post('/charges/search', auth.secured, charges.searchTransaction.http, charges.searchTransaction.exceptions)

router.get('/stripe/create', auth.secured, auth.administrative, stripe.create)
router.post('/stripe/create', auth.secured, auth.administrative, stripe.createAccount.http, stripe.createAccount.exceptions)

router.get('/stripe/basic/create', auth.secured, stripe.basic)
router.post('/stripe/basic/create', auth.secured, stripe.basicCreate)

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
router.get('/transactions/:id', auth.secured, transactions.show)
router.get('/transactions/:id/parity', auth.secured, parity.validateLedgerTransaction)

router.get('/transactions', auth.secured, transactions.list)

router.get('/platform/dashboard', auth.secured, platform.dashboard)
router.get('/platform/dashboard/live', auth.secured, platform.live)

router.get('/logout', auth.secured, auth.revokeSession)

router.get('/healthcheck', healthcheck.response)

module.exports = router
