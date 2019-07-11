declare module 'https-proxy-agent' {
  import * as https from 'https'

  namespace HttpsProxyAgent {
      interface HttpsProxyAgentOptions {
          host: string
          port: number
          secureProxy?: boolean
          headers?: {
              [key: string]: string
          }
          [key: string]: any
      }
  }

  class HttpsProxyAgent extends https.Agent {
      constructor(opts: HttpsProxyAgent.HttpsProxyAgentOptions)
  }

  export = HttpsProxyAgent
}