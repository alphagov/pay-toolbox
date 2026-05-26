// github OAuth strategy
const { Strategy } = require('passport-github2')
const config = require('../../../config')
const logger = require('../../logger')

const { checkUserAccess} = require('./permissions')
const {PermissionLevel} = require("../types")

const githubAuthCredentials = {
  clientID: config.auth.AUTH_GITHUB_CLIENT_ID,
  clientSecret: config.auth.AUTH_GITHUB_CLIENT_SECRET,
  callbackURL: config.auth.AUTH_GITHUB_RETURN_URL
}

const axios = require('axios')

const handleGitHubOAuthSuccessResponse = async function handleGitHubOAuthSuccessResponse(
  accessToken,
  refreshToken,
  profile,
  callback
) {
  const { username, displayName } = profile
  const avatarUrl = profile._json && profile._json.avatar_url
  const sessionProfile = { username, displayName, avatarUrl, accessToken }

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


async function revokeGithubGrant(accessToken) {
  if (!accessToken) return;

  const { clientID, clientSecret } = githubAuthCredentials;

  try {
    const response = await axios.delete(`https://api.github.com/applications/${clientID}/grant`, {
      auth: {
        username: clientID,
        password: clientSecret
      },
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      data: {
        access_token: accessToken
      }
    });

    logger.info('Successfully revoked token status:', response.status);
    return response.data;

  } catch (error) {
    logger.error(`Failed to revoke GitHub grant: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

module.exports = { Strategy, githubAuthCredentials, handleGitHubOAuthSuccessResponse, revokeGithubGrant }
