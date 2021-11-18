import registerDebug from 'debug'
import { Source } from '../component'
import { Readable } from 'stream'
import { MessageType } from '../message'

const debug = registerDebug('msl:http-mp4')

export interface HttpConfig {
  uri: string
  options?: RequestInit
}

/**
 * HttpMp4
 *
 * Stream MP4 data over HTTP/S, and use Axis-specific
 * headers to determine MIME type and stream transformation.
 */
export class HttpMp4Source extends Source {
  public uri: string
  public options?: RequestInit
  public length?: number
  public onHeaders?: (headers: Headers) => void
  public onServerClose?: () => void

  private _reader?: ReadableStreamDefaultReader<Uint8Array>
  private _abortController?: AbortController
  private _allDone: boolean

  /**
   * Create an HTTP component.
   *
   * The constructor sets a single readable stream from a fetch.
   */
  constructor(config: HttpConfig) {
    const { uri, options } = config
    /**
     * Set up an incoming stream and attach it to the socket.
     */
    const incoming = new Readable({
      objectMode: true,
      read: function () {
        //
      },
    })

    // When an error is sent on the incoming stream, close the socket.
    incoming.on('error', (e) => {
      console.warn('closing socket due to incoming error', e)
      this._reader && this._reader.cancel()
    })

    /**
     * initialize the component.
     */
    super(incoming)

    // When a read is requested, continue to pull data
    incoming._read = () => {
      this._pull()
    }

    this.uri = uri
    this.options = options
    this._allDone = false
  }

  play(): void {
    if (this.uri === undefined) {
      throw new Error('cannot start playing when there is no URI')
    }

    this._abortController = new AbortController()

    this.length = 0
    fetch(this.uri, {
      credentials: 'include',
      signal: this._abortController.signal,
      ...this.options,
    })
      .then((rsp) => {
        if (rsp.body === null) {
          throw new Error('empty response body')
        }

        const contentType = rsp.headers.get('Content-Type')
        this.incoming.push({
          data: Buffer.alloc(0),
          type: MessageType.ISOM,
          mime: contentType,
        })

        this.onHeaders && this.onHeaders(rsp.headers)

        this._reader = rsp.body.getReader()
        this._pull()
      })
      .catch((err) => {
        console.error('http-source: fetch failed: ', err)
      })
  }

  abort(): void {
    this._reader &&
      this._reader.cancel().catch((err) => {
        console.log('http-source: cancel reader failed: ', err)
      })
    this._abortController && this._abortController.abort()
  }

  _isClosed(): boolean {
    return this._allDone
  }

  _close(): void {
    this._reader = undefined
    this._allDone = true
    this.incoming.push(null)
    this.onServerClose?.()
  }

  _pull(): void {
    if (this._reader === undefined) {
      return
    }

    this._reader
      .read()
      .then(({ done, value }) => {
        if (done) {
          if (!this._isClosed()) {
            debug('fetch completed, total downloaded: ', this.length, ' bytes')
            this._close()
          }
          return
        }
        if (value === undefined) {
          throw new Error('expected value to be defined')
        }
        if (this.length === undefined) {
          throw new Error('expected length to be defined')
        }
        this.length += value.length
        const buffer = Buffer.from(value)
        if (!this.incoming.push({ data: buffer, type: MessageType.ISOM })) {
          // Something happened down stream that it is no longer processing the
          // incoming data, and the stream buffer got full.
          // This could be because we are downloading too much data at once,
          // or because the downstream is frozen. The latter is most likely
          // when dealing with a live stream (as in that case we would expect
          // downstream to be able to handle the data).
          debug('downstream back pressure: pausing read')
        } else {
          // It's ok to read more data
          this._pull()
        }
      })
      .catch((err) => {
        debug('http-source: read failed: ', err)
        if (!this._isClosed()) {
          this._close()
        }
      })
  }
}
