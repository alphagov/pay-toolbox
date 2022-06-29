import http from 'http'
import https from 'https'
import createError from 'http-errors'
import axios, { AxiosInstance, AxiosResponse, AxiosError, AxiosRequestConfig, Method } from 'axios'
import { App } from './shared'

/** Base HTTP client with common helpers for all microservices */
export default class Client {
  _axios: AxiosInstance
  private _app: App

  constructor(baseURL: string, app: App, options: PayHooks) {
    this._app = app
    this._axios = axios.create({
      baseURL,
      timeout: 60 * 1000,
      maxContentLength: 50 * 1000 * 1000,
      httpAgent: new http.Agent({
        keepAlive: true
      }),
      httpsAgent: new https.Agent({
        keepAlive: true,
        rejectUnauthorized: process.env.NODE_ENV === 'production'
      })
    })
    this._configure(baseURL, options)
  }

  /**
   * Pull out the data object given a successful HTTP response.
   * @param response - HTTP response object
   */
  protected _unpackResponseData<T>(response: AxiosResponse): T {
    return response.data
  }

  /**
   * Parses generic HTTP errors, throwing more specific errors given certain
   * criteria.
   * @param error - HTTP error object
   */
  protected _unpackErrorResponse(error: AxiosError, label?: string, id?: number | string): undefined {
    const code = Number(error.response?.status || error.code)
    if (code === 404 && label && id) {
      throw createError(code, `${label} with identifier ${id} was not found.`)
    }
    throw createError(code)
  }

  _configure(baseUrl: string, options: PayHooks): void {
    this._axios.defaults.baseURL = baseUrl
    this._axios.interceptors.request.use((request): AxiosRequestConfigWithMetadata => {
      const headers = options.transformRequestAddHeaders ? options.transformRequestAddHeaders() : {}
      Object.entries(headers)
        .forEach(([ headerKey, headerValue ]) => {
          request.headers[headerKey] = headerValue
        })

      return {
        ...request,
        metadata: { start: Date.now() }
      }
    })

    this._axios.interceptors.response.use((response): AxiosResponse => {
      const context: PayRequestContext = {
        service: this._app,
        responseTime: Date.now() - (response.config as AxiosRequestConfigWithMetadata).metadata.start,
        method: response.config.method,
        params: response.config.params,
        status: response.status,
        url: response.config.url
      }
      if (options.successResponse) options.successResponse(context)
      return response
    }, (error: AxiosError) => {
      const config = error.config as AxiosRequestConfigWithMetadata || {}
      const context: PayRequestContext = {
        service: this._app,
        responseTime: Date.now() - (config.metadata && config.metadata.start),
        method: config.method,
        params: config.params,
        status: error.response && error.response.status,
        url: config.url,
        code: (error.response && error.response.status) || error.code
      }
      if (options.failureResponse) options.failureResponse(context)
      throw error
    })
  }

  /**
   * Perform microservice healthcheck
   * @returns "is healthy" response
   */
  async healthy(): Promise<boolean> {
    try {
      await this._axios.get('/healthcheck')
      return true
    } catch(e) {
      return false
    }
  }
}

interface PayRequestContext {
  /** Response time in ms */
  responseTime: number;
  service: App;
  params: { [key: string]: string | number | boolean | undefined };
  status?: number;
  url?: string;
  code?: number | string;
  method?: Method;
}

interface AxiosRequestConfigWithMetadata extends AxiosRequestConfig {
  metadata?: {
    start: number;
  }
}

export type PayRequestHeaders = { [key: string]: string }

export interface PayHooks {
 transformRequestAddHeaders?(): PayRequestHeaders;
 successResponse?(context: PayRequestContext): void;
 failureResponse?(context: PayRequestContext): void;
}