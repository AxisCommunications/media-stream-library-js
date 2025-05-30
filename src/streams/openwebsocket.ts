// Time in milliseconds we want to wait for a websocket to open
const WEBSOCKET_TIMEOUT = 10007

export interface WebSocketConfig {
  uri: string
  tokenUri?: string
  protocol?: string
  timeout?: number
}

/**
 * Open a new WebSocket, fallback to token-auth on failure and retry.
 */
export const openWebSocket = async ({
  uri,
  tokenUri,
  protocol = 'binary',
  timeout = WEBSOCKET_TIMEOUT,
}: WebSocketConfig): Promise<WebSocket> => {
  if (uri === undefined) {
    throw new Error('ws: internal error')
  }

  return await new Promise((resolve, reject) => {
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
        if (!tokenUri) {
          console.warn(
            'websocket open failed and no token URI specified, quiting'
          )
          reject(originalError)
        }
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
