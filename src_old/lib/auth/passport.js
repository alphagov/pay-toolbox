// configure app wide passport instance
const passport = require('passport')
const HTTPSProxyAgent = require('https-proxy-agent')

const { disableAuth } = require('./../../config')
const { Strategy, githubAuthCredentials, handleGitHubOAuthSuccessResponse } = require('./github/strategy')

const serialiseAuthForSession = function serialiseAuthForSession(profile, done) {
  done(null, profile)
}

const deserialiseAuthFromSession = function deserialiseAuthFromSession(profile, done) {
  done(null, profile)
}

passport.serializeUser(serialiseAuthForSession)
passport.deserializeUser(deserialiseAuthFromSession)

if (!disableAuth) {
  const strategy = new Strategy(githubAuthCredentials, handleGitHubOAuthSuccessResponse)

  // temporarily force oauth2 strategy to use proxy agent until the library supports https proxy
  const httpsProxy = process.env.https_proxy
  // eslint-disable-next-line no-underscore-dangle
  if (httpsProxy) strategy._oauth2.setAgent(new HTTPSProxyAgent(httpsProxy))

  passport.use(strategy)
}

module.exports = passport
