// @FIXME(sfount) move to utility - see if there is a way of doing this in general on pay Node repos
// @FIXME(sfount) move to templater macro type file (probably in global config)
const toCurrencyString = amount => `£${amount.toFixed(2)}`

const formatStatsAsTableRows = function formatStatsAsTableRows (stats) {
  // @FIXME(sfount) replace these templates with a more robust library for currencies
  return [
    [ { text: 'Total Payments' }, { text: stats.total_volume } ],
    [ { text: 'Total Amount' }, { text: toCurrencyString(stats.total_amount) } ],
    [ { text: 'Average Amount' }, { text: toCurrencyString(stats.average_amount) } ]
  ]
}

module.exports = { formatStatsAsTableRows }
