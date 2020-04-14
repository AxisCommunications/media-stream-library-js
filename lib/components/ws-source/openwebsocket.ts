import { merge } from '../../utils/config'

// Time in milliseconds we want to wait for a websocket to open
const WEBSOCKET_TIMEOUT = 10007

export interface WSConfig {
  host?: string
  scheme?: string
  uri?: string
  tokenUri?: string
  protocol?: string
  timeout?: number
}

// Default configuration
const defaultConfig = (
  host: string = window.location.host,
  scheme: string = window.location.protocol,
): WSConfig => {
  const wsScheme = scheme === 'https:' ? 'wss:' : 'ws:'

  return {
    uri: `${wsScheme}//${host}/rtsp-over-websocket`,
    tokenUri: `${scheme}//${host}/axis-cgi/rtspwssession.cgi`,
    protocol: 'binary',
    timeout: WEBSOCKET_TIMEOUT,
  }
}

/**
 * Open a new WebSocket, fallback to token-auth on failure and retry.
 * @param  {Object} [config={}]  WebSocket configuration.
 * @param  {String} [config.host]  Specify different host
 * @param  {String} [config.sheme]  Specify different scheme.
 * @param  {String} [config.uri]  Full uri for websocket connection
 * @param  {String} [config.tokenUri]  Full uri for token API
 * @param  {String} [config.protocol] Websocket protocol
 * @param  {Number} [config.timeout] Websocket connection timeout
 * @return {Promise}  Resolves with WebSocket, rejects with error.
 */
export const openWebSocket = (config: WSConfig = {}): Promise<WebSocket> => {
  const { uri, tokenUri, protocol, timeout } = merge(
    defaultConfig(config.host, config.scheme),
    config,
  )

  if (uri === undefined) {
    throw new Error('ws: internal error')
  }

  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(uri, protocol)
      const countdown = setTimeout(() => {
        clearTimeout(countdown)
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onerror = null
          reject(new Error('websocket connection timed out'))
        }
      }, timeout)
      ws.binaryType = 'arraybuffer'
      ws.onerror = (originalError: Event) => {
        clearTimeout(countdown)
        // try fetching an authentication token
        function onLoadToken(this: XMLHttpRequest) {
          if (this.status >= 400) {
            console.warn('failed to load token', this.status, this.responseText)
            reject(originalError)
            return
          }
          const token = this.responseText.trim()
          // We have a token! attempt to open a WebSocket again.
          const newUri = `${uri}?rtspwssession=${token}`
          const ws2 = new WebSocket(newUri, protocol)
          ws2.binaryType = 'arraybuffer'
          ws2.onerror = (err) => {
            reject(err)
          }
          ws2.onopen = () => resolve(ws2)
        }
        const request = new XMLHttpRequest()
        request.addEventListener('load', onLoadToken)
        request.addEventListener('error', (err) => {
          console.warn('failed to get token')
          reject(err)
        })
        request.addEventListener('abort', () => reject(originalError))
        request.open('GET', `${tokenUri}?${Date.now()}`)
        try {
          request.send()
        } catch (error) {
          reject(originalError)
        }
      }
      ws.onopen = () => {
        clearTimeout(countdown)
        resolve(ws)
      }
    } catch (e) {
      reject(e)
    }
  })
}
