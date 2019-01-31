// simple formatting methods for dates and currencies

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP'
})

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false
})

const toFormattedDate = function toFormattedDate (date) {
  return dateFormatter.format(date)
}

const toFormattedDateLong = function toFormattedDateLong (date) {
  return date.toDateString()
}

const toCurrencyString = function toCurrencyString (total) {
  return currencyFormatter.format(total)
}

module.exports = { toFormattedDate, toCurrencyString, toFormattedDateLong }
