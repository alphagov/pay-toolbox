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
const transactions = require('./modules/transactions')
const discrepancies = require('./modules/discrepancies')
const stripe = require('./modules/stripe')

// @TODO(sfount) remove `default`s on update to import export syntax
// eslint-disable-next-line import/no-unresolved
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

router.get('/services', auth.secured, services.overview)
router.get('/services/search', auth.secured, services.search)
router.post('/services/search', auth.secured, services.searchRequest)
router.get('/services/:id', auth.secured, services.detail.http, services.detail.exceptions)
router.get('/services/:id/branding', auth.secured, services.branding, services.detail.exceptions)
router.post('/services/:id/branding', auth.secured, services.updateBranding)
router.get('/services/:id/link_accounts', auth.secured, services.linkAccounts, services.detail.exceptions)
router.post('/services/:id/link_accounts', auth.secured, services.updateLinkAccounts.http, services.updateLinkAccounts.exceptions)

router.get('/discrepancies/search', auth.secured, discrepancies.search)
router.post('/discrepancies/search', auth.secured, discrepancies.getDiscrepancyReport)
router.post('/discrepancies/resolve/:id', auth.secured, discrepancies.resolveDiscrepancy)

router.get('/transactions/search', auth.secured, transactions.search)
router.post('/transactions/search', auth.secured, transactions.searchTransaction.http, transactions.searchTransaction.exceptions)

router.get('/stripe/create', auth.secured, stripe.create)
router.post('/stripe/create', auth.secured, stripe.createAccount.http, stripe.createAccount.exceptions)

router.get('/stripe/basic/create', auth.secured, stripe.basic)
router.post('/stripe/basic/create', auth.secured, stripe.basicCreate)

// @TODO(sfount) simple to integrate into table action - should be reconsidered for POST or PATCH
router.get('/users/:id', auth.secured, users.show)
router.get('/users/:id/phone', auth.secured, users.updatePhoneNumberForm)
router.post('/users/:id/phone', auth.secured, users.updatePhoneNumber)
router.get('/users/:id/email', auth.secured, users.updateEmailForm)
router.post('/users/:id/email', auth.secured, users.updateEmail)

router.get('/logout', auth.secured, auth.revokeSession)

router.get('/healthcheck', healthcheck.response)

module.exports = router
