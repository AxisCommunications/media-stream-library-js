import { Adapter, IsomMessage, MseSink } from './components'

export interface HttpMp4Config {
  uri: string
  options?: RequestInit
  mediaElement: HTMLVideoElement
}

/*
 * HttpMsePipeline
 *
 * A pipeline that connects to an HTTP server and can process an MP4 data stream
 * that is then sent to a HTML video element
 *
 * Handlers that can be set on the pipeline:
 * - `onServerClose`: called when the server closes the connection
 */
export class HttpMp4Pipeline {
  public onHeaders?: (headers: Headers) => void
  public onServerClose?: () => void
  /** Initiates the stream and resolves when the media stream has completed */
  public start: () => Promise<void>

  private _mediaElement: HTMLVideoElement
  private _abortController: AbortController
  private _downloadedBytes: number = 0

  constructor(config: HttpMp4Config) {
    const { uri, options, mediaElement } = config

    this._mediaElement = mediaElement
    this._abortController = new AbortController()

    this.start = () =>
      fetch(uri, { signal: this._abortController.signal, ...options })
        .then(({ headers, body }) => {
          const mimeType = headers.get('Content-Type')
          if (!mimeType) {
            throw new Error('missing MIME type in HTTP response headers')
          }
          if (body === null) {
            throw new Error('missing body in HTTP response')
          }
          const adapter = new Adapter<IsomMessage>((chunk) => {
            this._downloadedBytes += chunk.byteLength
            return new IsomMessage({ data: chunk })
          })
          const mseSink = new MseSink(mediaElement, mimeType)
          return body.pipeThrough(adapter).pipeTo(mseSink.writable)
        })
        .catch((err) => {
          console.error('failed to stream media:', err)
        })
  }

  close() {
    this._abortController.abort()
  }

  get currentTime() {
    return this._mediaElement.currentTime
  }

  play() {
    return this._mediaElement.play()
  }

  pause() {
    return this._mediaElement.pause()
  }

  byteLength() {
    return this._downloadedBytes
  }
}
