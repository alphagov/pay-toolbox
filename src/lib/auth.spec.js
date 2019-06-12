const chai = require('chai')
const spies = require('chai-spies')

const { expect } = chai
chai.use(spies)

const auth = require('./auth')

const requestMock = {}

describe('Authorisation middleware', () => {
  it('secured should allow authenticated requests', () => {
    const responseSpy = chai.spy()
    const nextSpy = chai.spy()

    requestMock.isAuthenticated = () => true
    auth.secured(requestMock, responseSpy, nextSpy)

    expect(nextSpy).to.have.been.called.once.with()
  })

  it('secured should block unauthenticated requests, redirecting them to /auth', () => {
    const responseSpy = {
      redirect: chai.spy()
    }
    const nextSpy = chai.spy()

    requestMock.isAuthenticated = () => false
    auth.secured(requestMock, responseSpy, nextSpy)

    expect(responseSpy.redirect).to.have.been.called.with('/auth')
  })
})
