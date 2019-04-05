// eslint-disable-next-line global-require
// if (process.env.NODE_ENV !== 'production') require('dotenv').config()
require('dotenv').config()

const server = require('./server')
const logger = require('./logger')
const common = require('./common')
const services = require('./services')

module.exports = Object.assign({}, server, common, logger, services)
