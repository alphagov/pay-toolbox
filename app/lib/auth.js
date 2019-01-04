/**
 * Authentication middleware allowing developers to put all private content
 * behind Google/ GitHub (TBD) authenticated sessions. Provides helper methods
 * for requesting authentication
 *
 * - note the current architecture design thoughts here are to put a
 *   bitly/oauth proxy. This way headers are checked for valid signatures,
 *   potentially groups and read/ write permissions. All requests that are
 *   outside of that will be rejected and anything with this valid signature
 *   will be served (no resources in this case will be public)
 */
// @TODO(sfount) if cookie parser is not required (header data is sent encrypted
// in some other way) remove this dependency
const cookieParser = require('cookie-parser')

const logger = require('./logger')

// @TODO(sfount) make sure to log when new authentication or non-active sessions have gained access
// - auditing this software will be essential
// - log (all logs) should show the users hash who had permission to perform actions - at least a way to look the user up
// @FIXME(sfount) @TODO(sfount) see previous TODO

// Simple middleware method to ensure that all `req` objects passed in have
// sufficient access headers to access secured routes. Any route that specifies
// `secured` will be rejected without these headers.
// @TODO(sfount) header checks
const secured = function secured (req, res, next) {
  // @TODO(sfount) experiment with actual headers passed - validation should
  // happen both at the reverse proxy and with this server (using shared
  // .env secrets)
  const identityHeader = 'X-OAuth-Header-Secret'
  const oAuthProxyIdentityHeader = req.get(identityHeader)

  // @TODO(sfount)
  // if (validateHeaderWithSecrets(oAuthProxiyIdentitiyHeader)) {
    // next()
  // }

  // @TODO(sfount)
  // header is invalid
  // res.status(403).send()

  next()
}

module.exports = { secured }
