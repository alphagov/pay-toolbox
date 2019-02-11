const _ = require('lodash')

const addEntityIfValid = function (object, params, modelName, name) {
  try {
    object[name] = Reflect.construct(modelName, [params]).basicObject()
  } catch (e) {
    console.log(`${modelName.name} not added: ${e.message}`)
  }
  return Object.assign({}, object)
}

const stripEmpty = function (object) {
  return _.pickBy(object, _.identity)
}

module.exports = { addEntityIfValid, stripEmpty }
