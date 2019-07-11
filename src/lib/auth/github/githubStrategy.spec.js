/* eslint-disable global-require */
// @TODO(sfount) mockery subsitutes are slow taking ~200ms, this could make test times explode
const mockery = require('mockery')
const chai = require('chai')
const spies = require('chai-spies')

const { expect } = chai

chai.use(spies)

const validPermissions = async () => true
const invalidPermissions = async () => {
  throw new Error('Invalid permissions')
}

describe('GitHub OAuth strategy', () => {
  // eslint-disable-next-line key-spacing
  const profile = { username: 'some-test-user', displayName: 'Some User', _json: { avatar_url : 'some-url' } }
  let handleGitHubOAuthSuccessResponse

  beforeEach(() => {
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
      useCleanCache: true
    })
  })
  afterEach(() => { mockery.disable() })

  it('invokes callback with `true` valid permissions and profile details given valid permissions', async () => {
    const authCallbackSpy = chai.spy()
    mockery.registerMock('./permissions', { isPermittedUser: validPermissions })
    // eslint-disable-next-line prefer-destructuring
    handleGitHubOAuthSuccessResponse = require('./strategy').handleGitHubOAuthSuccessResponse

    await handleGitHubOAuthSuccessResponse('some-access-token', 'some-refresh-token', profile, authCallbackSpy)

    expect(authCallbackSpy).to.have.been.called.once.with(
      null,
      {
        username: profile.username,
        displayName: profile.displayName,

        // eslint-disable-next-line no-underscore-dangle
        avatarUrl: profile._json.avatar_url
      }
    )
  })

  it('invokes callback with `false` invalid permissions given invalid permissions', async () => {
    const authCallbackSpy = chai.spy()
    mockery.registerMock('./permissions', { isPermittedUser: invalidPermissions })
    // eslint-disable-next-line prefer-destructuring
    handleGitHubOAuthSuccessResponse = require('./strategy').handleGitHubOAuthSuccessResponse

    await handleGitHubOAuthSuccessResponse('some-access-token', 'some-refresh-token', profile, authCallbackSpy)
    expect(authCallbackSpy).to.have.been.called.once.with(null, false)
  })
})
