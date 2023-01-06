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
})
