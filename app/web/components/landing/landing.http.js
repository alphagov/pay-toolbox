/**
 * Primary landing (dashboard) page, builds responses to HTTP requests
 */

/**
 * @METHOD GET
 * @PATH /
 */
const root = function root (req, res, next) {
  res.render('landing/landing')
}

module.exports = { root }
