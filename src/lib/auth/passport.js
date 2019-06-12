// configure app wide passport instance
const passport = require('passport')
const logger = require('../logger')

const { Strategy, githubAuthCredentials, handleGitHubOAuthSuccessResponse } = require('./github')

const serialiseAuthForSession = function serialiseAuthForSession(profile, done) {
  done(null, profile)
}

const deserialiseAuthFromSession = function deserialiseAuthFromSession(profile, done) {
  done(null, profile)
}

passport.serializeUser(serialiseAuthForSession)
passport.deserializeUser(deserialiseAuthFromSession)

passport.use(new Strategy(githubAuthCredentials, handleGitHubOAuthSuccessResponse))

module.exports = passport
