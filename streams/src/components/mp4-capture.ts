import { logInfo } from '../log'

import { IsomMessage } from './types'

const MAX_CAPTURE_BYTES = 225000000 // 5 min at a rate of 6 Mbit/s

/**
 * Component that records MP4 data.
 */
export class Mp4Capture extends TransformStream<IsomMessage, IsomMessage> {
  private _activeCallback?: (buffer: Uint8Array) => void
  private _capture: boolean
  private _bufferOffset: number
  private readonly _bufferSize: number
  private _buffer: Uint8Array

  constructor(maxSize = MAX_CAPTURE_BYTES) {
    super({
      transform: (msg, controller) => {
        const type = msg.type
        const data = msg.data

        // Arrival of ISOM with MIME type indicates new movie, start recording if active.
        if (this._activeCallback && msg.mimeType !== undefined) {
          this._capture = true
        }

        // If capture enabled, record all ISOM (MP4) boxes
        if (this._capture) {
          if (this._bufferOffset < this._buffer.byteLength - data.byteLength) {
            this._buffer.set(data, this._bufferOffset)
            this._bufferOffset += data.byteLength
          } else {
            this.stop()
          }
        }
        controller.enqueue(msg)
      },
      flush: () => {
        this.stop()
      },
    })

    this._buffer = new Uint8Array(0)
    this._bufferSize = maxSize
    this._bufferOffset = 0

    this._activeCallback = undefined
    this._capture = false
  }

  /**
   * Activate video capture. The capture will begin when a new movie starts,
   * and will terminate when the movie ends or when the buffer is full. On
   * termination, the callback you passed will be called with the captured
   * data as argument.
   * @param callback  Will be called when data is captured.
   */
  start(callback: (buffer: Uint8Array) => void) {
    if (!this._activeCallback) {
      logInfo('start MP4 capture')
      this._activeCallback = callback
      this._buffer = new Uint8Array(this._bufferSize)
      this._bufferOffset = 0
    }
  }

  /**
   * Deactivate video capture. This ends an ongoing capture and prevents
   * any further capturing.
   */
  stop() {
    if (this._activeCallback) {
      logInfo(`stop MP4 capture, collected ${this._bufferOffset} bytes`)

      try {
        this._activeCallback(this._buffer.slice(0, this._bufferOffset))
      } catch (err) {
        console.error('capture callback failed:', err)
      }

      this._buffer = new Uint8Array(0)
      this._bufferOffset = 0

      this._activeCallback = undefined
      this._capture = false
    }
  }
}
