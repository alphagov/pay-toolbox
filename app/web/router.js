/**
 * Defines a router to be applied to the main web HTTP `app` instance
 */
const express = require('express')

const auth = require('./../lib/auth')

// Component imports
const landing = require('./components/landing/landing.http')

// @TODO(sfount) remove comment - router can now have its own middleware
// specified seperately from the application - the overall application
// middleware should still apply to the router
const router = express.Router()

// root level entry into web application
// @TODO(sfount) reconsider API - is it better to explicitly state that all
// routes are auth.secured or should this be put in a middleware that is more
// 'magic'
router.get('/', auth.secured, landing.root)

module.exports = router
