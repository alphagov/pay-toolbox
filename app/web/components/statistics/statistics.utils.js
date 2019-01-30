const { toCurrencyString } = require('./../../../lib/format')

const formatStatsAsTableRows = function formatStatsAsTableRows (stats) {
  return [
    [ { text: 'Total Payments' }, { text: stats.total_volume } ],
    [ { text: 'Total Amount' }, { text: toCurrencyString(stats.total_amount / 100) } ], // stats resolved to pence?
    [ { text: 'Average Amount' }, { text: toCurrencyString(stats.average_amount / 100) } ] // stats resolved to pence?
  ]
}

module.exports = { formatStatsAsTableRows }
