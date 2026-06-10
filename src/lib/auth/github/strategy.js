// github OAuth strategy
const { Strategy } = require('passport-github2')
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
  if (!accessToken) return

  const { clientID, clientSecret } = githubAuthCredentials
  const credentials = Buffer.from(`${clientID}:${clientSecret}`).toString('base64')

  const resp = await fetch(`https://api.github.com/applications/${clientID}/grant`, {
    method: 'DELETE',
    headers: {
      Authorization: `Basic ${credentials}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: JSON.stringify({ access_token: accessToken })
  })

  if (resp.status !== 204 && resp.status !== 404) {
    throw new Error(`GitHub grant revoke failed: ${resp.status}`)
  }
}

module.exports = { Strategy, githubAuthCredentials, handleGitHubOAuthSuccessResponse, revokeGithubGrant }
