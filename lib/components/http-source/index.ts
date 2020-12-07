import registerDebug from 'debug'
import { Source } from '../component'
import { Readable } from 'stream'
import { MessageType } from '../message'

const debug = registerDebug('msl:http-source')

interface Headers {
  [key: string]: string
}

export interface HttpConfig {
  uri: string
  headers?: Headers
}

export class HttpSource extends Source {
  public uri: string
  public headers?: Headers
  public length?: number

  private _reader?: ReadableStreamDefaultReader<Uint8Array>

  /**
   * Create an HTTP component.
   *
   * The constructor sets a single readable stream from a fetch.
   */
  constructor(config: HttpConfig) {
    const { uri, headers } = config

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
    this.headers = headers
  }

  play(): void {
    if (this.uri === undefined) {
      throw new Error('cannot start playing when there is no URI')
    }

    this.length = 0
    fetch(this.uri, { headers: this.headers })
      .then((rsp) => {
        if (rsp.body === null) {
          throw new Error('empty response body')
        }

        this._reader = rsp.body.getReader()
        this._pull()
      })
      .catch((err) => {
        throw new Error(err)
      })
  }

  _pull(): void {
    if (this._reader === undefined) {
      return
    }

    this._reader.read().then(({ done, value }) => {
      if (done) {
        debug('fetch completed, total downloaded: ', this.length, ' bytes')
        this.incoming.push(null)
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
      if (!this.incoming.push({ data: buffer, type: MessageType.RAW })) {
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
  }
}
