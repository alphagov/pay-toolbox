// GitHub specific permission level access
// responsible for accessing the GitHub API and checking is user has certain team permissions
import axios from 'axios'

import config from '../../../config'
import logger from '../../logger'
import {PermissionLevel} from '../types'

async function isUserMemberOfGitHubTeam(username: string, token: string, team: string): Promise<boolean> {
  const url = `${config.auth.GITHUB_API_ENDPOINT}/organizations/${config.auth.GITHUB_ALPHAGOV_ORGANISATION_ID}/team/${team}/memberships/${username}`
  const githubRestOptions = {
    headers: {
      Authorization: `token ${token}`
    }
  }

  logger.info(`Requesting team ${team} permissions for ${username}`)
  try {
    await axios.get(url, githubRestOptions)
    logger.info(`User ${username} is a member of team ${team}`)
    return true
  } catch (err) {
    logger.info(`User ${username} is not a member of team ${team}`)
    return false
  }
}

export async function checkUserAccess(username: string, token: string) {
  if (await isUserMemberOfGitHubTeam(username, token, config.auth.AUTH_GITHUB_ADMIN_TEAM_ID)) {
    return {permitted: true, permissionLevel: PermissionLevel.ADMIN}
  } else if (await isUserMemberOfGitHubTeam(username, token, config.auth.AUTH_GITHUB_USER_SUPPORT_TEAM_ID)) {
    return {permitted: true, permissionLevel: PermissionLevel.USER_SUPPORT}
  } else if (await isUserMemberOfGitHubTeam(username, token, config.auth.AUTH_GITHUB_VIEW_ONLY_TEAM_ID)) {
    return {permitted: true, permissionLevel: PermissionLevel.VIEW_ONLY}
  } else {
    return {permitted: false}
  }
}
