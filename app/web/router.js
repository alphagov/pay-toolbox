/**
 * Defines a router to be applied to the main web HTTP `app` instance
 */
const express = require('express')

const auth = require('./../lib/auth')

// Component imports
const landing = require('./components/landing/landing.http')
const statistics = require('./components/statistics/statistics.http')
const gatewayAccounts = require('./components/gateway_accounts/gateway_accounts.http.js')

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
router.get('/gateway_accounts/:id', auth.secured, gatewayAccounts.detail)

router.get('/gateway_accounts/:id/api_keys', auth.secured, gatewayAccounts.apiKeys)
router.get('/gateway_accounts/:accountId/api_keys/:tokenId/delete', auth.secured, gatewayAccounts.deleteApiKey)

router.post('/gateway_accounts/create', auth.secured, gatewayAccounts.writeAccount)
router.post('/gateway_accounts/create/confirm', auth.secured, gatewayAccounts.confirm)

module.exports = router
