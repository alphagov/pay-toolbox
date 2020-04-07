const moment = require('moment')

const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP'
})

const dateFormatterOptions = {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
  timeZoneName: 'short'
}

const dateFormatter = new Intl.DateTimeFormat('en-GB', { ...dateFormatterOptions, 'timeZone': 'UTC' })
const dateFormatterLocalTimeZone = new Intl.DateTimeFormat('en-GB', dateFormatterOptions)

const unixDateFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  month: 'short',
  day: '2-digit'
})

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
  toFormattedDate,
  toFormattedDateLocalTimeZone,
  toCurrencyString,
  toFormattedDateLong,
  toUnixDate,
  toISODateString,
  toFormattedDateSince
}
