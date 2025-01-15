import { Adapter, IsomMessage, MseSink } from './components'
import { logDebug } from './log'
import { setupMp4Capture } from './mp4-capture'

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
 */
export class HttpMp4Pipeline {
  private abortController?: AbortController
  private downloadedBytes: number = 0
  private options?: RequestInit
  private uri: string
  public readonly mediaElement: HTMLVideoElement
  public streamStart?: number

  constructor(config: HttpMp4Config) {
    const { uri, options, mediaElement } = config

    this.uri = uri
    this.options = options

    this.mediaElement = mediaElement
  }

  /** Initiates the stream and resolves when the media stream has completed.
   * Returns the original response headers and a result promise. */
  public async start(
    msgHandler?: (msg: IsomMessage) => void
  ): Promise<{ headers: Headers; finished: Promise<void> }> {
    this.abortController?.abort('stream restarted')

    this.abortController = new AbortController()

    const { ok, headers, status, statusText, body } = await fetch(this.uri, {
      signal: this.abortController.signal,
      ...this.options,
    })

    if (!ok) {
      throw new Error(`response not ok, status: ${statusText} (${status})`)
    }

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

    const mseSink = new MseSink(this.mediaElement, mimeType)
    if (msgHandler) {
      mseSink.onMessage = msgHandler
    }

    this.streamStart = performance.now()
    const finished = body
      .pipeThrough(adapter)
      .pipeTo(mseSink.writable)
      .then(() => {
        logDebug(`http-mp4 pipeline ended: stream ended`)
      })
      .catch((err) => {
        logDebug(`http-mp4 pipeline ended: ${err}`)
      })

    return { headers, finished }
  }

  public close() {
    this.abortController?.abort('Closed by user')
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

  public get bitrate() {
    return this.streamStart !== undefined
      ? (8 * this.downloadedBytes) /
          ((performance.now() - this.streamStart) / 1000)
      : 0
  }

  /** Refresh the stream and passes the captured MP4 data to the provided
   * callback. Capture can be ended by calling the returned trigger, or
   * if the buffer reaches max size. */
  public async capture(callback: (bytes: Uint8Array) => void) {
    this.close()
    const { capture, triggerEnd } = setupMp4Capture(callback)
    await this.start(capture)
    return triggerEnd
  }
}
