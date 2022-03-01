// GitHub specific permission level access
// responsible for accessing the GitHub API and checking is user has certain team permissions
const axios = require('axios')

const config = require('../../../config')
const logger = require('../../logger')

const GITHUB_API_ENDPOINT = `https://api.github.com`
const GITHUB_ALPHAGOV_ORGANISATION_ID = 596977

const validateUserTeamMembership = async function validateUserTeamMembership(user, token, team) {
  const url = `${GITHUB_API_ENDPOINT}/organizations/${GITHUB_ALPHAGOV_ORGANISATION_ID}/team/${team}/memberships/${user}`
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
