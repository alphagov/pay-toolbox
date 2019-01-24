/**
 * Defines a router to be applied to the main web HTTP `app` instance
 */
const express = require('express')

const auth = require('./../lib/auth')

// Component imports
const landing = require('./components/landing/landing.http')
const statistics = require('./components/statistics/statistics.http')
const gatewayAccounts = require('./components/gateway_accounts')
const services = require('./components/services')
const transactions = require('./components/transactions/transactions.http')

// @TODO(sfount) remove comment - router can now have its own middleware
// specified seperately from the application - the overall application
// middleware should still apply to the router
const router = express.Router()

// root level entry into web application
// @TODO(sfount) reconsider API - is it better to explicitly state that all
// routes are auth.secured or should this be put in a middleware that is more
// 'magic'
router.get('/', auth.secured, landing.root)

// @TODO(sfount) consider splitting up routes into seperate routers
router.get('/statistics', auth.secured, statistics.overview)

// @deprecated (to be combined into single route/ page)
router.get('/statistics/filter/date', auth.secured, statistics.dateFilterRequest)
router.post('/statistics/filter/date', auth.secured, statistics.dateFilter)

// @deprecated (to be combined into single route/ page)
router.get('/statistics/compare/date', auth.secured, statistics.compareFilterRequest)
router.post('/statistics/compare/date', auth.secured, statistics.compareFilter)

router.get('/statistics/services', auth.secured, statistics.byServices)

router.get('/gateway_accounts', auth.secured, gatewayAccounts.overview)
router.get('/gateway_accounts/create', auth.secured, gatewayAccounts.create)
router.get('/gateway_accounts/:id', auth.secured, gatewayAccounts.detail.http, gatewayAccounts.detail.exceptions)

router.get('/gateway_accounts/:id/api_keys', auth.secured, gatewayAccounts.apiKeys)
router.get('/gateway_accounts/:accountId/api_keys/:tokenId/delete', auth.secured, gatewayAccounts.deleteApiKey)

router.post('/gateway_accounts/create', auth.secured, gatewayAccounts.writeAccount.http, gatewayAccounts.writeAccount.exceptions)
router.post('/gateway_accounts/create/confirm', auth.secured, gatewayAccounts.confirm.http, gatewayAccounts.confirm.exceptions)

router.get('/services', auth.secured, services.overview)

router.get('/services/search', auth.secured, services.search)
router.post('/services/search', auth.secured, services.searchRequest)

router.get('/services/:id', auth.secured, services.detail.http, services.detail.exceptions)

router.get('/services/:id/branding', auth.secured, services.branding)
router.post('/services/:id/branding', auth.secured, services.updateBranding)

router.get('/services/:id/link_accounts', auth.secured, services.linkAccounts)
router.post('/services/:id/link_accounts', auth.secured, services.updateLinkAccounts.http, services.updateLinkAccounts.exceptions)

router.get('/transactions/search', auth.secured, transactions.search)
router.post('/transactions/search', auth.secured, transactions.searchTransaction)

module.exports = router
