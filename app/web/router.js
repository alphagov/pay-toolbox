/**
 * Defines a router to be applied to the main web HTTP `app` instance
 */
const express = require('express')

const auth = require('./../lib/auth')

// Component imports
const landing = require('./components/landing/landing.http')
const statistics = require('./components/statistics/statistics.http')

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

module.exports = router
