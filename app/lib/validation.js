const _ = require('lodash')

const logger = require('../lib/logger')

const addModelIfValid = function addModelIfValid(target, source, modelName, modelKey) {
  try {
    // @TODO(sfount) this method should be redesigned to not override objects
    //               passed in
    // eslint-disable-next-line no-param-reassign
    target[modelKey] = Reflect.construct(modelName, [ source ]).basicObject()
  } catch (e) {
    logger.debug(`${modelName.name} not added: ${e.message}`)
  }
  return Object.assign({}, target)
}

const stripEmpty = function stripEmpty(object) {
  return _.pickBy(object, _.identity)
}

module.exports = { addModelIfValid, stripEmpty }
