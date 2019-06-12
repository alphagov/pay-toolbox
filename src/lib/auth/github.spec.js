/* eslint-disable global-require */
// @TODO(sfount) mockery subsitutes are slow taking ~200ms, this could make test times explode
const mockery = require('mockery')
const chai = require('chai')
const spies = require('chai-spies')

const { expect } = chai

chai.use(spies)

const validPermissions = async (username, token) => true
const invalidPermissions = async (username, token) => {
  throw new Error('Invalid permissions')
}

describe('GitHub OAuth strategy', () => {
  const profile = { username: 'some-test-user', displayName: 'Some User', avaterUrl: 'some-url' }
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
    const spy = chai.spy()
    mockery.registerMock('./../permissions', { isPermittedUser: validPermissions })
    // eslint-disable-next-line prefer-destructuring
    handleGitHubOAuthSuccessResponse = require('./github').handleGitHubOAuthSuccessResponse

    await handleGitHubOAuthSuccessResponse('some-access-token', 'some-refresh-token', profile, spy)

    expect(spy).to.have.been.called.once.with(
      null,
      { user: profile.username, fullName: profile.displayName, avatarUrl: profile.avatarUrl }
    )
  })

  it('invokes callback with `false` invalid permissions given invalid permissions', async () => {
    const spy = chai.spy()
    mockery.registerMock('./../permissions', { isPermittedUser: invalidPermissions })
    // eslint-disable-next-line prefer-destructuring
    handleGitHubOAuthSuccessResponse = require('./github').handleGitHubOAuthSuccessResponse

    await handleGitHubOAuthSuccessResponse('some-access-token', 'some-refresh-token', profile, spy)
    expect(spy).to.have.been.called.once.with(null, false)
  })
})
