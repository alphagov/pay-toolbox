// github OAuth strategy
const { Strategy } = require('passport-github')
const config = require('../../../config')
const logger = require('../../logger')

const { checkUserAccess} = require('./permissions')
const {PermissionLevel} = require("../types");

const githubAuthCredentials = {
  clientID: config.auth.AUTH_GITHUB_CLIENT_ID,
  clientSecret: config.auth.AUTH_GITHUB_CLIENT_SECRET,
  callbackURL: config.auth.AUTH_GITHUB_RETURN_URL
}

const handleGitHubOAuthSuccessResponse = async function handleGitHubOAuthSuccessResponse(
  accessToken,
  refreshToken,
  profile,
  callback
) {
  const { username, displayName } = profile
  const avatarUrl = profile._json && profile._json.avatar_url
  const sessionProfile = { username, displayName, avatarUrl }

  logger.info(`Successful account auth from GitHub for user ${username}`)

  try {
    const userAccessCheckResult = await checkUserAccess(username, accessToken)
    if (userAccessCheckResult.permitted) {
      sessionProfile.permissionLevel = userAccessCheckResult.permissionLevel
      logger.info(`User is authorised with permission level ${PermissionLevel[userAccessCheckResult.permissionLevel]}, setting session for ${username}`)
      callback(null, sessionProfile)
    } else {
      logger.warn(`User ${username} is not a member of any GitHub groups granting access`)
      callback(null, false)
    }
  } catch (err) {
    logger.warn(`Failed to check permissions for user ${username} [${err.message}]`)
    callback(null, false, err)
  }
}

module.exports = { Strategy, githubAuthCredentials, handleGitHubOAuthSuccessResponse }
