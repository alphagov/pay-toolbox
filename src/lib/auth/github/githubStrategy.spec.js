/* eslint-disable global-require */
// @TODO(sfount) mockery subsitutes are slow taking ~200ms, this could make test times explode
const mockery = require('mockery')
const sinon = require('sinon')

const {PermissionLevel} = require('../types')

const validPermissions = async () => true
const invalidPermissions = async () => {
  throw new Error('Invalid permissions')
}

describe('GitHub OAuth strategy', () => {
  // eslint-disable-next-line key-spacing
  const profile = {username: 'some-test-user', displayName: 'Some User', _json: {avatar_url: 'some-url'}}
  let handleGitHubOAuthSuccessResponse

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
  })
  afterEach(() => {
    mockery.disable()
  })

  describe('valid permissions', () => {
    it('invokes callback with `true` and profile details with USER_SUPPORT permission level when user does not have admin permissions', async () => {
      const authCallbackSpy = sinon.spy()
      mockery.registerMock('./permissions', {isPermittedUser: validPermissions})
      // eslint-disable-next-line prefer-destructuring
      handleGitHubOAuthSuccessResponse = require('./strategy').handleGitHubOAuthSuccessResponse

      await handleGitHubOAuthSuccessResponse('some-access-token', 'some-refresh-token', profile, authCallbackSpy)

      sinon.assert.calledWith(authCallbackSpy,
        null,
        {
          username: profile.username,
          displayName: profile.displayName,
          permissionLevel: PermissionLevel.USER_SUPPORT,

          // eslint-disable-next-line no-underscore-dangle
          avatarUrl: profile._json.avatar_url
        }
      )
    })

    it('invokes callback with ADMIN permissionLevel when user has admin permissions', async () => {
      const authCallbackSpy = sinon.spy()
      mockery.registerMock('./permissions', {isAdminUser: validPermissions})
      // eslint-disable-next-line prefer-destructuring
      handleGitHubOAuthSuccessResponse = require('./strategy').handleGitHubOAuthSuccessResponse

      await handleGitHubOAuthSuccessResponse('some-access-token', 'some-refresh-token', profile, authCallbackSpy)
      sinon.assert.calledWith(authCallbackSpy,
        null,
        {
          username: profile.username,
          displayName: profile.displayName,
          permissionLevel: PermissionLevel.ADMIN,

          // eslint-disable-next-line no-underscore-dangle
          avatarUrl: profile._json.avatar_url
        }
      )
    })
  })

  describe('invalid permissions', () => {
    it('invokes callback with `false`', async () => {
      const authCallbackSpy = sinon.spy()
      mockery.registerMock('./permissions', {isPermittedUser: invalidPermissions})
      // eslint-disable-next-line prefer-destructuring
      handleGitHubOAuthSuccessResponse = require('./strategy').handleGitHubOAuthSuccessResponse

      await handleGitHubOAuthSuccessResponse('some-access-token', 'some-refresh-token', profile, authCallbackSpy)
      sinon.assert.calledWith(authCallbackSpy, null, false)
    })
  })
})
