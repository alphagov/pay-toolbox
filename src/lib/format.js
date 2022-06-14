const moment = require('moment')

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP'
})

const dateFormatterOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
  timeZoneName: 'short'
}

const dateFormatterWithoutTimestamp = new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })
const dateFormatter = new Intl.DateTimeFormat('en-GB', { ...dateFormatterOptions, 'timeZone': 'UTC' })
const dateFormatterLocalTimeZone = new Intl.DateTimeFormat('en-GB', dateFormatterOptions)

const unixDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric'
})

const toSimpleDate = function toSimpleDate(date) {
  return date != null ? dateFormatterWithoutTimestamp.format(new Date(date)) : null
}

const toFormattedDate = function toFormattedDate (date) {
  return dateFormatter.format(date)
}

const toFormattedDateLocalTimeZone = function toFormattedDate (date) {
  return dateFormatterLocalTimeZone.format(date)
}

const toFormattedDateLong = function toFormattedDateLong (date) {
  return date.toDateString()
}

const toCurrencyString = function toCurrencyString (total) {
  return currencyFormatter.format(total)
}

const toUnixDate = function toUnixDate (timestamp) {
  const date = new Date(timestamp * 1000)
  return unixDateFormatter.format(date)
}

const toISODateString = function toISODateString (timestamp) {
  const date = new Date(timestamp * 1000)
  return date.toISOString().split('T')[0]
}

const toFormattedDateSince = function toFormattedDateSince (date) {
  return moment(date).fromNow()
}

module.exports = {
  toSimpleDate,
  toFormattedDate,
  toFormattedDateLocalTimeZone,
  toCurrencyString,
  toFormattedDateLong,
  toUnixDate,
  toISODateString,
  toFormattedDateSince
}
