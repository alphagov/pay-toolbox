const http = require('./events.http')

module.exports = {
  emitByIdPage: http.emitByIdPage,
  emitByDatePage: http.emitByDatePage,
  parityCheckerPage: http.parityCheckerPage,
  emitById: http.emitById,
  emitByDate: http.emitByDate,
  parityCheck: http.parityCheck
}
