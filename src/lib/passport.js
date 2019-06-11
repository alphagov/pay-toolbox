// configure app wide passport instance
const passport = require('passport')
const { Strategy } = require('passport-github')

const logger = require('./../lib/logger')
const config = require('./../config')
const { isPermittedUser } = require('./../lib/permissions')

const githubAuthCredentials = {
  clientID: config.auth.AUTH_GITHUB_CLIENT_ID,
  clientSecret: config.auth.AUTH_GITHUB_CLIENT_SECRET,
  callbackURL: config.auth.AUTH_GITHUB_RETURN_URL
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
  try {
    // eslint-disable-next-line no-underscore-dangle
    const avatarUrl = profile._json.avatar_url
    const sessionProfile = {
      user: username,
      fullName: displayName,
      avatarUrl
    }

    logger.info(`Successful account auth from GitHub for user ${username}`)
    await isPermittedUser(username, accessToken)

    logger.info(`Permissions valid for user, setting session for ${username}`)
    callback(null, sessionProfile)
  } catch (e) {
    logger.warn(`Permissions rejected for user ${username} [${e.message}]`)
    callback(null, false, e)
  }
}

passport.serializeUser(serialiseAuthForSession)
passport.deserializeUser(deserialiseAuthFromSession)

passport.use(new Strategy(githubAuthCredentials, handleOAuthSuccessResponse))

module.exports = passport
