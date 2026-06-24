// github OAuth strategy
const { Strategy } = require('passport-github2')
const { createOAuthAppAuth } = require('@octokit/auth-oauth-app')
const config = require('../../../config')
const logger = require('../../logger')

const { checkUserAccess} = require('./permissions')
const {PermissionLevel} = require("../types");
const {Octokit} = require("@octokit/core");
const undici = require('undici')

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

  const sessionProfile = {
    username,
    displayName,
    avatarUrl,
    githubAccessToken: accessToken
  }

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

  try {
    const octokit = new Octokit({
      authStrategy: createOAuthAppAuth,
      auth:{
        clientType: 'oauth-app',
        clientId: githubAuthCredentials.clientID,
        clientSecret: githubAuthCredentials.clientSecret,
      },
      request: {
        fetch: octokitHttpProxy
      }
    })

    await octokit.request('DELETE /applications/{client_id}/grant', {
      client_id: githubAuthCredentials.clientId,
      access_token: accessToken,
      headers: {
        'X-GitHub-Api-Version': '2026-03-10'
      }
    })

  } catch (error) {
    logger.error(`Failed to revoke GitHub grant: ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

const octokitHttpProxy = (url, options) => {
  const httpsProxy = process.env.https_proxy
  try {
    return undici.fetch(url, {
      ...options,
      dispatcher: new undici.ProxyAgent(httpsProxy)
    })
  } catch (error) {
    logger.error(`Failed to fetch undici proxy agent: ${error.message}`);
  }
}


module.exports = { Strategy, githubAuthCredentials, handleGitHubOAuthSuccessResponse, revokeGithubGrant }
