const proxyquire = require('proxyquire')
const sinon = require('sinon')

const {PermissionLevel} = require('../types')

describe('GitHub OAuth strategy', () => {
  // eslint-disable-next-line key-spacing
  const profile = {username: 'some-test-user', displayName: 'Some User', _json: {avatar_url: 'some-url'}}

  it('invokes callback with `true` and profile details when user has sufficient permissions', async () => {
    const authCallbackSpy = sinon.spy()
    const strategy = getStrategyWithMocks(() => Promise.resolve(PermissionLevel.USER_SUPPORT))

    await strategy.handleGitHubOAuthSuccessResponse('some-access-token', 'some-refresh-token', profile, authCallbackSpy)

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

  it('invokes callback with `false` when user does not have sufficient permissions', async () => {
    const authCallbackSpy = sinon.spy()
    const strategy = getStrategyWithMocks(() => Promise.resolve(false))

    await strategy.handleGitHubOAuthSuccessResponse('some-access-token', 'some-refresh-token', profile, authCallbackSpy)
    sinon.assert.calledWith(authCallbackSpy, null, false)
  })

  it('invokes callback with `false` when there is an error checking permissions', async () => {
    const authCallbackSpy = sinon.spy()
    const strategy = getStrategyWithMocks(() => Promise.reject(new Error()))

    await strategy.handleGitHubOAuthSuccessResponse('some-access-token', 'some-refresh-token', profile, authCallbackSpy)
    sinon.assert.calledWith(authCallbackSpy, null, false)
  })
})

function getStrategyWithMocks(getPermissionLevelMock) {
  return proxyquire('./strategy', {
    './permissions': {
      getPermissionLevel: getPermissionLevelMock
    }
  })
}
