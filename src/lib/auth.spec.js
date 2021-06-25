const chai = require('chai')
const spies = require('chai-spies')

const { expect } = chai
chai.use(spies)

const auth = require('./auth')

const requestMock = { session: {} }

describe('Authorisation middleware', () => {
  it('secured middleware should allow authenticated requests', () => {
    const responseSpy = chai.spy()
    const nextSpy = chai.spy()

    requestMock.isAuthenticated = () => true
    auth.secured(requestMock, responseSpy, nextSpy)

    expect(nextSpy).to.have.been.called.once.with()
  })

  it('secured middleware should block unauthenticated requests, redirecting them to /auth', () => {
    const responseSpy = {
      redirect: chai.spy()
    }
    const nextSpy = chai.spy()

    requestMock.originalUrl = '/path/to/some/resource'
    requestMock.isAuthenticated = () => false
    auth.secured(requestMock, responseSpy, nextSpy)

    expect(requestMock.session.authBlockedRedirectUrl).to.equal('/path/to/some/resource')
    expect(responseSpy.redirect).to.have.been.called.with('/auth')
  })

  it('secured middleware should clear redirect url on successful auth to avoid sessin pollution', () => {
    requestMock.isAuthenticated = () => true
    auth.secured(requestMock, chai.spy(), chai.spy())
    expect(requestMock.session.authBlockedRedirectUrl).to.equal(undefined)
  })

  it('unauthorised HTTP route should reject with 403 given aunauthenticated request', () => {
    const send = chai.spy()
    const responseSpy = {
      status: () => ({ send })
    }
    const nextSpy = chai.spy()

    requestMock.isAuthenticated = () => false
    auth.unauthorised(requestMock, responseSpy, nextSpy)

    expect(send).to.have.been.called.with('User does not have permissions to access the resource')
  })
})
