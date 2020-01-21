export const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP'
})

export const numberFormatter = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0
})