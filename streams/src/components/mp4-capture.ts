import { logInfo } from '../log'

import { IsomMessage } from './types'

const MAX_CAPTURE_BYTES = 225000000 // 5 min at a rate of 6 Mbit/s

/**
 * Component that records MP4 data.
 */
export class Mp4Capture extends TransformStream<IsomMessage, IsomMessage> {
  private activeCallback?: (buffer: Uint8Array) => void
  private capture: boolean
  private bufferOffset: number
  private readonly bufferSize: number
  private buffer: Uint8Array

  constructor(maxSize = MAX_CAPTURE_BYTES) {
    super({
      transform: (msg, controller) => {
        const type = msg.type
        const data = msg.data

        // Arrival of ISOM with MIME type indicates new movie, start recording if active.
        if (this.activeCallback && msg.mimeType !== undefined) {
          this.capture = true
        }

        // If capture enabled, record all ISOM (MP4) boxes
        if (this.capture) {
          if (this.bufferOffset < this.buffer.byteLength - data.byteLength) {
            this.buffer.set(data, this.bufferOffset)
            this.bufferOffset += data.byteLength
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

    this.buffer = new Uint8Array(0)
    this.bufferSize = maxSize
    this.bufferOffset = 0

    this.activeCallback = undefined
    this.capture = false
  }

  /**
   * Activate video capture. The capture will begin when a new movie starts,
   * and will terminate when the movie ends or when the buffer is full. On
   * termination, the callback you passed will be called with the captured
   * data as argument.
   * @param callback  Will be called when data is captured.
   */
  start(callback: (buffer: Uint8Array) => void) {
    if (!this.activeCallback) {
      logInfo('start MP4 capture')
      this.activeCallback = callback
      this.buffer = new Uint8Array(this.bufferSize)
      this.bufferOffset = 0
    }
  }

  /**
   * Deactivate video capture. This ends an ongoing capture and prevents
   * any further capturing.
   */
  stop() {
    if (this.activeCallback) {
      logInfo(`stop MP4 capture, collected ${this.bufferOffset} bytes`)

      try {
        this.activeCallback(this.buffer.slice(0, this.bufferOffset))
      } catch (err) {
        console.error('capture callback failed:', err)
      }

      this.buffer = new Uint8Array(0)
      this.bufferOffset = 0

      this.activeCallback = undefined
      this.capture = false
    }
  }
}
