const http = require('./stripe.http')
const exceptions = require('./stripe.exceptions')

module.exports = {
  create: http.create,
  createAccount: {
    http: http.createAccount,
    exceptions: exceptions.createAccount
  }
}
