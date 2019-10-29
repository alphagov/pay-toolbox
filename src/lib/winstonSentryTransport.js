import * as TransportStream from 'winston-transport'
import * as Sentry from '@sentry/node'

export default class WinstonSentryTransport extends TransportStream {
  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info)
    })

    Sentry.captureException(new Error(JSON.stringify(info)))
    callback()
  }
}

