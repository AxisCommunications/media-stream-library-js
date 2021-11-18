import { Pipeline } from './pipeline'
import { HttpMp4Source, HttpConfig } from '../components/http-mp4'
import { MseSink } from '../components/mse'

export interface HttpMseConfig {
  http: HttpConfig
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
export class HttpMsePipeline extends Pipeline {
  public onHeaders?: (headers: Headers) => void
  public onServerClose?: () => void
  public http: HttpMp4Source

  private readonly _src?: HttpMp4Source
  private readonly _sink: MseSink

  constructor(config: HttpMseConfig) {
    const { http: httpConfig, mediaElement } = config

    const httpSource = new HttpMp4Source(httpConfig)
    const mseSink = new MseSink(mediaElement)

    httpSource.onHeaders = (headers) => {
      this.onHeaders && this.onHeaders(headers)
    }

    httpSource.onServerClose = () => this.onServerClose?.()

    super(httpSource, mseSink)

    this._src = httpSource
    this._sink = mseSink

    // Expose session for external use
    this.http = httpSource
  }

  close() {
    this._src && this._src.abort()
  }

  get currentTime() {
    return this._sink.currentTime
  }

  async play() {
    return await this._sink.play()
  }

  pause() {
    return this._sink.pause()
  }
}
