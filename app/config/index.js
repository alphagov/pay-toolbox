const server = require('./server')
const logger = require('./logger')
const common = require('./common')
const templateRenderer = require('./template-renderer')

// module.exports = { server, common }
module.exports = Object.assign({}, server, common, logger, templateRenderer)
