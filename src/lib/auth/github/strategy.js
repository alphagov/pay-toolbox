// github OAuth strategy
const { Strategy } = require('passport-github')
const config = require('../../../config')
const logger = require('../../logger')

const { isPermittedUser, isAdminUser } = require('./permissions')
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
  // eslint-disable-next-line no-underscore-dangle
  const avatarUrl = profile._json && profile._json.avatar_url
  const sessionProfile = { username, displayName, avatarUrl }

  logger.info(`Successful account auth from GitHub for user ${username}`)

  try {
    await isAdminUser(username, accessToken)

    sessionProfile.permissionLevel = PermissionLevel.ADMIN
    logger.info(`Administrator checks passed, setting session for ${username}`)
    callback(null, sessionProfile)
  } catch (adminUserFailure) {
    try {
      await isPermittedUser(username, accessToken)
      sessionProfile.permissionLevel = PermissionLevel.USER_SUPPORT

      logger.info(`Valid non-admin permissions, setting session for ${username}`)
      callback(null, sessionProfile)
    } catch (permittedUserFailure) {
      logger.warn(`Permissions rejected for user ${username} [${permittedUserFailure.message}]`)
      callback(null, false, permittedUserFailure)
    }
  }
}

module.exports = { Strategy, githubAuthCredentials, handleGitHubOAuthSuccessResponse }
