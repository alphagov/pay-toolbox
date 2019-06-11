// GitHub specific permission level access
// responsible for accessing the GitHub API and checking is user has certain team permissions
const axios = require('axios')

// @TODO(sfount) use app config vs. directly accessing process
const process = require('process')

const logger = require('./../lib/logger')

const GITHUB_TEAMS_API_ENDPOINT = 'https://api.github.com/teams'
// ${teamID}/members/${memberName}

const validateUserTeamMembership = async function validateUserTeamMembership(user, token, team) {
  const url = `${GITHUB_TEAMS_API_ENDPOINT}/${team}/members/${user}`
  const githubRestOptions = {
    headers: {
      Authorization: `token ${token}`
    }
  }

  logger.info(`Requesting team ${team} permissions for ${user}`)
  // const membershipResponse = await axios.get(GITHUB_TEAMS_API_ENDPOINT, githubRestOptions)
  // the only `then` path will be a valid response, anything else will propagate the error up
  return axios.get(url, githubRestOptions)
}

const isPermittedUser = function isPermittedUser(user, token) {
  const team = process.env.AUTH_GITHUB_TEAM_ID
  return validateUserTeamMembership(user, token, team)
}

const isAdminUser = function isAdminUser(user, token) {
  const team = process.env.AUTH_GITHUB_ADMIN_TEAM_ID
  return validateUserTeamMembership(user, token, team)
}

module.exports = { isPermittedUser, isAdminUser }
