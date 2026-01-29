const _ = require('lodash')

const logger = require('../lib/logger')

const addModelIfValid = function addModelIfValid(target, source, modelName, modelKey) {
  try {
    target[modelKey] = Reflect.construct(modelName, [ source ]).basicObject()
  } catch (e) {
    logger.debug(`${modelName.name} not added: ${e.message}`)
  }
  return { ...target }
}

const stripEmpty = function stripEmpty(object) {
  return _.pickBy(object, _.identity)
}

module.exports = { addModelIfValid, stripEmpty }
