import { Pipeline } from './pipeline'
import { HttpSource, HttpConfig } from '../components/http-source'
import { MseSink } from '../components/mse'
import { Mp4Parser } from '../components/mp4-parser'

export interface HttpMseConfig {
  http: HttpConfig
  mediaElement: HTMLVideoElement
}

/*
 * HttpMsePipeline
 *
 * A pipeline that connects to an HTTP server and can process an MP4 data stream
 * that is then sent to a HTML video element
 */
export class HttpMsePipeline extends Pipeline {
  public http: HttpSource

  private readonly _src?: HttpSource
  private readonly _sink: MseSink

  constructor(config: HttpMseConfig) {
    const { http: httpConfig, mediaElement } = config

    const httpSource = new HttpSource(httpConfig)
    const mp4Parser = new Mp4Parser()
    const mseSink = new MseSink(mediaElement)

    super(httpSource, mp4Parser, mseSink)

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
