// Time in milliseconds we want to wait for a websocket to open
const WEBSOCKET_TIMEOUT = 10007

let tokenPromise: Promise<string> | undefined

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

  let wsUri = uri
  const isSafari =
    navigator.userAgent.includes('Safari') &&
    !navigator.userAgent.includes('Chrome')

  if (isSafari) {
    /**
     * Workaround for Safari on Apple-products
     * Websocket does not handle digest authentication. This causes
     * An extra login being shown to the user.
     * Request a token from the server, when then can be passed to
     * uri.
     */
    if (tokenPromise === undefined) {
      tokenPromise = new Promise((resolve, reject) => {
        if (!tokenUri) {
          reject('openwebsocket: no token URI specified, quiting')
          return
        }
        fetch(`${tokenUri}?${Date.now()}`, {
          method: 'GET',
        })
          .then((response) => {
            if (!response.ok) {
              console.warn(
                'openwebsocket: failed to load token',
                response.status,
                response.statusText
              )
              reject()
            }
            return response.text()
          })
          .then((token) => resolve(token.trim()))
          .catch((e) => reject(e))
      })
    }
    const token = await tokenPromise
    const separator = uri.includes('?') ? '&' : '?'
    wsUri = `${uri}${separator}rtspwssession=${encodeURIComponent(token)}`
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUri, protocol)
    ws.binaryType = 'arraybuffer'

    const timeoutHandler = () => {
      // A general connection timeout if it takes too long to connect.
      window.clearTimeout(countdown)
      if (ws.readyState === WebSocket.CONNECTING) {
        ws.onerror = null
        reject(new Error('openwebsocket: connection timed out'))
      }
    }
    const countdown = window.setTimeout(timeoutHandler, timeout)

    ws.onopen = () => {
      // The original request worked!
      window.clearTimeout(countdown)
      resolve(ws)
    }
    ws.onerror = (e) => {
      console.error('openwebsocket: failed', e)
      reject(e)
    }
  })
}
