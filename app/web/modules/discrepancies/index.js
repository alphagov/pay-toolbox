const http = require('./discrepancies.http')

module.exports = {
  search: http.search,
  getDiscrepancyReport: http.getDiscrepancyReport,
  resolveDiscrepancy: http.resolveDiscrepancy
}
