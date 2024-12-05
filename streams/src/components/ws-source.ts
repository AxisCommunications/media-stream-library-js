// Named status codes for CloseEvent

import { logWarn } from '../log'

// https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
const CLOSE_NORMAL_CLOSURE = 1000
const CLOSE_GOING_AWAY = 1001
const CLOSE_ABORTED = 4000

/**
 * WebSocket source.
 *
 * Sets up a readable and writable stream of raw messages
 * connected to the provided WebSocket. The socket has to
 * have binaryType "ArrayBuffer".
 */
export class WSSource {
  public readable: ReadableStream<Uint8Array>
  public writable: WritableStream<Uint8Array>

  constructor(socket: WebSocket) {
    if (socket === undefined) {
      throw new Error('socket argument missing')
    }

    if (socket.binaryType !== 'arraybuffer') {
      throw new Error('socket must be of binaryType "arraybuffer"')
    }

    this.readable = new ReadableStream<Uint8Array>({
      start: (controller) => {
        socket.addEventListener(
          'message',
          (e: MessageEvent<ArrayBufferLike>) => {
            controller.enqueue(new Uint8Array(e.data))
          }
        )
        socket.addEventListener('close', (e) => {
          if (e.code === CLOSE_GOING_AWAY) {
            logWarn('server closed connection')
          }
          controller.close()
        })
      },
      cancel: () => {
        logWarn('canceling WebSocket client')
        socket.close(CLOSE_ABORTED, 'client canceled')
      },
    })

    this.writable = new WritableStream<Uint8Array>({
      start: (controller) => {
        socket.addEventListener('close', (e) => {
          controller.error(`WebSocket closed with code ${e.code}`)
        })
        socket.addEventListener('error', () => {
          controller.error('WebSocket errored')
        })
      },
      write: (chunk) => {
        try {
          socket.send(chunk)
        } catch (err) {
          logWarn('message lost during send:', err)
        }
      },
      close: () => {
        if (socket.readyState !== WebSocket.CLOSED) {
          logWarn('closing WebSocket client')
          socket.close(CLOSE_NORMAL_CLOSURE)
        }
      },
      abort: (reason) => {
        if (socket.readyState !== WebSocket.CLOSED) {
          logWarn('aborting WebSocket client:', reason && reason.message)
          socket.close(CLOSE_ABORTED, reason && reason.message)
        }
      },
    })
  }
}
