// GitHub specific permission level access
// responsible for accessing the GitHub API and checking is user has certain team permissions
const axios = require('axios')

const config = require('./../config')
const logger = require('./../lib/logger')

const GITHUB_TEAMS_API_ENDPOINT = 'https://api.github.com/teams'

const validateUserTeamMembership = async function validateUserTeamMembership(user, token, team) {
  const url = `${GITHUB_TEAMS_API_ENDPOINT}/${team}/members/${user}`
  const githubRestOptions = {
    headers: {
      Authorization: `token ${token}`
    }
  }

  logger.info(`Requesting team ${team} permissions for ${user}`)
  return axios.get(url, githubRestOptions)
}

const isPermittedUser = function isPermittedUser(user, token) {
  const team = config.auth.AUTH_GITHUB_TEAM_ID
  return validateUserTeamMembership(user, token, team)
}

const isAdminUser = function isAdminUser(user, token) {
  const team = config.auth.AUTH_GITHUB_ADMIN_TEAM_ID
  return validateUserTeamMembership(user, token, team)
}

module.exports = { isPermittedUser, isAdminUser }
