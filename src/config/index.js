// eslint-disable-next-line global-require
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') require('dotenv').config()

const server = require('./server')
const logger = require('./logger')
const common = require('./common')
const services = require('./services')
const auth = require('./auth')

module.exports = Object.assign({}, server, common, logger, services, auth)
