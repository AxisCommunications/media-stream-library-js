import debug from 'debug'
import { Tube } from '../component'
import { Transform } from 'stream'
import { Message, MessageType } from '../message'

const MAX_CAPTURE_BYTES = 225000000 // 5 min at a rate of 6 Mbit/s

/**
 * Component that records MP4 data.
 */
export class Mp4Capture extends Tube {
  private _active: boolean
  private _capture: boolean
  private _captureCallback: (buffer: Buffer) => void
  private _bufferOffset: number
  private _bufferSize: number
  private _buffer: Buffer

  constructor(maxSize = MAX_CAPTURE_BYTES) {
    const incoming = new Transform({
      objectMode: true,
      transform: (msg: Message, _encoding, callback) => {
        // Arrival of ISOM with tracks indicates new movie, start recording if active.
        if (
          this._active &&
          msg.type === MessageType.ISOM &&
          msg.tracks !== undefined
        ) {
          this._capture = true
        }

        // If capture enabled, record all ISOM (MP4) boxes
        if (this._capture && msg.type === MessageType.ISOM) {
          if (
            this._bufferOffset <
            this._buffer.byteLength - msg.data.byteLength
          ) {
            msg.data.copy(this._buffer, this._bufferOffset)
            this._bufferOffset += msg.data.byteLength
          } else {
            this.stop()
          }
        }
        // Always pass on all messages
        callback(undefined, msg)
      },
    })

    // Stop any recording when the stream is closed.
    incoming.on('finish', () => {
      this.stop()
    })

    super(incoming)

    this._buffer = Buffer.allocUnsafe(0)
    this._bufferSize = maxSize
    this._bufferOffset = 0

    this._active = false
    this._capture = false
    this._captureCallback = () => {
      /** noop */
    }
  }

  /**
   * Activate video capture. The capture will begin when a new movie starts,
   * and will terminate when the movie ends or when the buffer is full. On
   * termination, the callback you passed will be called with the captured
   * data as argument.
   * @param callback  Will be called when data is captured.
   */
  start(callback: (buffer: Buffer) => void) {
    if (!this._active) {
      debug('msl:capture:start')(callback)

      this._captureCallback = callback

      this._buffer = Buffer.allocUnsafe(this._bufferSize)
      this._bufferOffset = 0

      this._active = true
    }
  }

  /**
   * Deactivate video capture. This ends an ongoing capture and prevents
   * any further capturing.
   */
  stop() {
    if (this._active) {
      debug('msl:capture:stop')(`captured bytes: ${this._bufferOffset}`)

      try {
        this._captureCallback(this._buffer.slice(0, this._bufferOffset))
      } catch (e) {
        console.error(e)
      }

      this._buffer = Buffer.allocUnsafe(0)
      this._bufferOffset = 0

      this._active = false
      this._capture = false
    }
  }
}
