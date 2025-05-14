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
    if (!tokenUri) {
      throw new Error('openwebsocket: no token URI specified, quiting')
    }
    const response = await fetch(`${tokenUri}?${Date.now()}`, {
      method: 'GET',
    })
    if (!response.ok) {
      console.warn(
        'openwebsocket: failed to load token',
        response.status,
        response.statusText
      )
      throw new Error('openwebsocket: failed to load token')
    }
    const token = await response.text()
    const rtspwssession = encodeURIComponent(token.trim())
    const separator = uri.includes('?') ? '&' : '?'
    wsUri = `${uri}${separator}rtspwssession=${rtspwssession}`
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
