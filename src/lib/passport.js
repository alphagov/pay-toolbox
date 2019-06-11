// configure app wide passport instance
const passport = require('passport')
const { Strategy } = require('passport-github')

const logger = require('./../lib/logger')
const { isPermittedUser } = require('./../lib/permissions')

// @TODO(sfount) use config files instead of directly accessing process
const process = require('process')

const githubAuthCredentials = {
  clientID: process.env.AUTH_GITHUB_CLIENT_ID,
  clientSecret: process.env.AUTH_GITHUB_CLIENT_SECRET,
  callbackURL: process.env.AUTH_GITHUB_RETURN_URL
}

const serialiseAuthForSession = function serialiseAuthForSession(profile, done) {
  done(null, profile)
}

const deserialiseAuthFromSession = function deserialiseAuthFromSession(profile, done) {
  done(null, profile)
}

// @TODO(sfount) return error if call to team permissions fails
const handleOAuthSuccessResponse = async function handleOAuthSuccessResponse(accessToken, refreshToken, profile, callback) {
  const { username, displayName } = profile
  // eslint-disable-next-line no-underscore-dangle
  const avatarUrl = profile._json.avatar_url

  try {
    const userHasAccess = await isPermittedUser(username, accessToken)
    const sessionProfile = {
      user: username,
      fullName: displayName,
      avatarUrl
    }
    logger.info('Authorisation accepted')
    callback(null, sessionProfile)
  } catch (e) {
    logger.warn('Authorisation rejected')
    console.log(e)
    callback(null, false, e)
  }
}

passport.serializeUser(serialiseAuthForSession)
passport.deserializeUser(deserialiseAuthFromSession)

passport.use(new Strategy(githubAuthCredentials, handleOAuthSuccessResponse))

module.exports = passport
