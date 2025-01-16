export const currencyFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  maximumFractionDigits: 0,
  minimumFractionDigits: 0
})

export const numberFormatter = new Intl.NumberFormat('en-GB', {
  maximumFractionDigits: 0
})