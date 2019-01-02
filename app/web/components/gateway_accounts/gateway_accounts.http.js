const payapi = require('./../../../lib/pay-request')

// @FIXME(sfount) - WHAT IF:
// - API rejects request
const overview = async function overview (req, res, next) {
  try {
    const response = await payapi.service('CONNECTOR', '/v1/api/accounts')
    res.render('gateway_accounts/overview', { accounts: response.accounts })
  } catch (error) {
    next(error)
  }
}

const create = async function create (req, res, next) {
  res.render('gateway_accounts/create')
}

module.exports = { overview, create }
