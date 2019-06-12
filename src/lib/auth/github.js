// github OAuth strategy
const { Strategy } = require('passport-github')
const config = require('../../config')
const logger = require('../logger')

const { isPermittedUser } = require('./../permissions')

const githubAuthCredentials = {
  clientID: config.auth.AUTH_GITHUB_CLIENT_ID,
  clientSecret: config.auth.AUTH_GITHUB_CLIENT_SECRET,
  callbackURL: config.auth.AUTH_GITHUB_RETURN_URL
}

// @TODO(sfount) return error if call to team permissions fails
const handleGitHubOAuthSuccessResponse = async function handleGitHubOAuthSuccessResponse(
  accessToken,
  refreshToken,
  profile,
  callback
) {
  const { username, displayName } = profile
  try {
    // eslint-disable-next-line no-underscore-dangle
    const avatarUrl = profile._json && profile._json.avatar_url
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

module.exports = { Strategy, githubAuthCredentials, handleGitHubOAuthSuccessResponse }
