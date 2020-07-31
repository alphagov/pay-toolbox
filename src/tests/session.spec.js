const request = require('supertest')
const app = require('../web/server')
const { expect } = require('chai')

describe('session cookies', () => {

  it('sets a cookie with expiration date on all routes', (done) => {
    request(app)
      .get('/healthcheck')
      .expect(200)
      .end((err, res) => {
        expect(res.headers['set-cookie'][0]).to.contain('expires=')
        expect(res.headers['set-cookie'][0]).to.not.contain('Invalid Date')
        expect(res.headers['set-cookie'][1]).to.contain('expires=')
        expect(res.headers['set-cookie'][1]).to.not.contain('Invalid Date')
        done()
      })
  })
})

