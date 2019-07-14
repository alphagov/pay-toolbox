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

const unixDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  month: 'short',
  day: '2-digit'
})

const toFormattedDate = function toFormattedDate(date) {
  return dateFormatter.format(date)
}

const toFormattedDateLong = function toFormattedDateLong(date) {
  return date.toDateString()
}

const toCurrencyString = function toCurrencyString(total) {
  return currencyFormatter.format(total)
}

const unixDate = function unixDate(timestamp) {
  const date = new Date(timestamp * 1000)
  return unixDateFormatter.format(date)
}

const filenameDate = function filenameDate(timestamp) {
  const date = new Date(timestamp * 1000)
  return date.toISOString().split('T')[0]
}

module.exports = { toFormattedDate, toCurrencyString, toFormattedDateLong, unixDate, filenameDate }
