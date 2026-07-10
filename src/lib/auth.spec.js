const {expect} = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const auth = require('./auth')
const {PermissionLevel} = require('./auth/types')

const requestMock = {
  session: {
    authBlockedRedirectUrl: '/somewhere'
  }
}
const responseSpy = {
  render: sinon.spy(),
  redirect: sinon.spy()
}
const nextSpy = sinon.spy()

describe('Authorisation middleware', () => {
  beforeEach(() => {
    responseSpy.render.resetHistory()
    responseSpy.redirect.resetHistory()
    nextSpy.resetHistory()
  })

  describe('secured middleware', () => {
    it('should allow requests without an authenticated user if disableAuth is true', () => {
      const middlewareWithAuthDisabled = proxyquire('./auth', {
        './../config': {
          disableAuth: true
        }
      })

      requestMock.isAuthenticated = () => false

      middlewareWithAuthDisabled.secured(PermissionLevel.USER_SUPPORT)(requestMock, responseSpy, nextSpy)

      sinon.assert.calledWithExactly(nextSpy)
      sinon.assert.notCalled(responseSpy.render)
      sinon.assert.notCalled(responseSpy.redirect)
      expect(requestMock.session.authBlockedRedirectUrl).to.equal(undefined)
    })

    it('should block unauthenticated requests, redirecting them to /auth', () => {
      requestMock.originalUrl = '/path/to/some/resource'
      requestMock.isAuthenticated = () => false
      auth.secured(PermissionLevel.USER_SUPPORT)(requestMock, responseSpy, nextSpy)

      sinon.assert.calledWith(responseSpy.redirect, '/auth')
      sinon.assert.notCalled(responseSpy.render)
      sinon.assert.notCalled(nextSpy)
      expect(requestMock.session.authBlockedRedirectUrl).to.equal('/path/to/some/resource')
    })

    it('should allow authenticated requests if user permission level is equal to the required permission level', () => {
      requestMock.isAuthenticated = () => true
      requestMock.user = {
        permissionLevel: PermissionLevel.VIEW_ONLY
      }
      auth.secured(PermissionLevel.VIEW_ONLY)(requestMock, responseSpy, nextSpy)

      sinon.assert.calledWithExactly(nextSpy)
      sinon.assert.notCalled(responseSpy.render)
      sinon.assert.notCalled(responseSpy.redirect)
      expect(requestMock.session.authBlockedRedirectUrl).to.equal(undefined)
    })

    it('should allow authenticated requests if user permission level is greater than the required permission level', () => {
      requestMock.isAuthenticated = () => true
      requestMock.user = {
        permissionLevel: PermissionLevel.ADMIN
      }
      auth.secured(PermissionLevel.USER_SUPPORT)(requestMock, responseSpy, nextSpy)

      sinon.assert.calledWithExactly(nextSpy)
      sinon.assert.notCalled(responseSpy.render)
      sinon.assert.notCalled(responseSpy.redirect)
      expect(requestMock.session.authBlockedRedirectUrl).to.equal(undefined)
    })

    it('should block requests if user permission level is less than the required permission level', () => {
      requestMock.isAuthenticated = () => true
      requestMock.user = {
        permissionLevel: PermissionLevel.VIEW_ONLY
      }
      auth.secured(PermissionLevel.USER_SUPPORT)(requestMock, responseSpy, nextSpy)

      sinon.assert.calledWith(responseSpy.render, 'common/error', {message: 'You do not have permission to access this resource.'})
      sinon.assert.notCalled(responseSpy.redirect)
      sinon.assert.notCalled(nextSpy)
      expect(requestMock.session.authBlockedRedirectUrl).to.equal(undefined)
    })
  })

  describe('unauthorised middleware', () => {
    it('unauthorised HTTP route should reject with 403 given an unauthenticated request', () => {
      const send = sinon.spy()
      const responseSpy = {
        status: () => ({send})
      }

      requestMock.isAuthenticated = () => false
      auth.unauthorised(requestMock, responseSpy, nextSpy)

      sinon.assert.calledWith(send, 'User does not have permissions to access the resource')
    })
  })

  describe('Github logout redirect flow', () => {
    it('redirects to /auth after logout', async () => {
      const req = {
        user: {
          username: 'test-user'
        },
        logout: sinon.stub().callsFake((callback) => callback())
      }

      const res = {
        redirect: sinon.spy()
      }

      await auth.revokeSession(req, res, nextSpy)

      sinon.assert.calledOnce(req.logout)
      sinon.assert.calledWith(res.redirect, 303, '/auth')
      sinon.assert.notCalled(nextSpy)
    })
  })

  describe('Github grant revocation', () => {
    it('revokes the GitHub grant before logging out when an access token exists', async () => {
      const revokeGithubGrant = sinon.stub().resolves()

      /** @type {typeof import('./auth')} */
      const authWithRevokeStub = proxyquire('./auth', {
        './auth/github/strategy': {
          revokeGithubGrant
        }
      })

      const req = {
        user: {
          username: 'test-user',
          githubAccessToken: 'github-token'
        },
        logout: sinon.stub().callsFake((callback) => callback())
      }

      const res = {
        redirect: sinon.spy()
      }

      await authWithRevokeStub.revokeSession(req, res, nextSpy)

      sinon.assert.calledOnce(revokeGithubGrant)
      sinon.assert.calledWithExactly(revokeGithubGrant, 'github-token')
      sinon.assert.calledOnce(req.logout)
      sinon.assert.calledWith(res.redirect, 303, '/auth')
    })
  })

  it('calls next if req.logout fails', async () => {
    const logoutError = new Error('logout failed')

    const req = {
      user: {
        username: 'test-user'
      },
      logout: sinon.stub().callsFake((callback) => callback(logoutError))
    }

    const res = {
      redirect: sinon.spy()
    }

    await auth.revokeSession(req, res, nextSpy)

    sinon.assert.calledOnce(req.logout)
    sinon.assert.calledWithExactly(nextSpy, logoutError)
    sinon.assert.notCalled(res.redirect)
  })
})
