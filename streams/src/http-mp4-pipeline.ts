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

  private readonly mediaElement: HTMLVideoElement
  private readonly abortController: AbortController
  private downloadedBytes: number = 0

  constructor(config: HttpMp4Config) {
    const { uri, options, mediaElement } = config

    this.mediaElement = mediaElement
    this.abortController = new AbortController()

    this.start = () =>
      fetch(uri, { signal: this.abortController.signal, ...options })
        .then(({ headers, body }) => {
          const mimeType = headers.get('Content-Type')
          if (!mimeType) {
            throw new Error('missing MIME type in HTTP response headers')
          }
          if (body === null) {
            throw new Error('missing body in HTTP response')
          }
          const adapter = new Adapter<IsomMessage>((chunk) => {
            this.downloadedBytes += chunk.byteLength
            return new IsomMessage({ data: chunk })
          })
          const mseSink = new MseSink(mediaElement, mimeType)
          return body.pipeThrough(adapter).pipeTo(mseSink.writable)
        })
        .catch((err) => {
          console.error('failed to stream media:', err)
        })
  }

  public close() {
    this.abortController.abort()
  }

  public get currentTime() {
    return this.mediaElement.currentTime
  }

  public play() {
    return this.mediaElement.play()
  }

  public pause() {
    return this.mediaElement.pause()
  }

  public get byteLength() {
    return this.downloadedBytes
  }
}
