const sinon = require('sinon')
const ledger = require('./ledger')

describe('Ledger REST helper methods', () => {
  describe('Filters', () => {
    it('Correctly propagates filter keys to request params', () => {
      const get = sinon.spy(() => Promise.resolve({}))
      const clientSpy = { get }
      const instance = ledger(clientSpy)

      const filters = { reference: 'somereference' }

      instance.transactions(100, 1, 'all', filters)

      sinon.assert.calledWith(
        get,
        sinon.match.any,
        sinon.match.has('params', sinon.match.has('reference'))
      )
    })
  })
})
