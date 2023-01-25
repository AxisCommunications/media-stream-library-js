import { Auth, AuthConfig } from '../components/auth'
import { CanvasSink } from '../components/canvas'
import { RtspConfig } from '../components/rtsp-session'
import { WSSource } from '../components/ws-source'
import { WSConfig } from '../components/ws-source/openwebsocket'

import { RtspMjpegPipeline } from './rtsp-mjpeg-pipeline'

export interface Html5CanvasConfig {
  ws?: WSConfig
  rtsp?: RtspConfig
  mediaElement: HTMLCanvasElement
  auth?: AuthConfig
}

/**
 * Html5CanvasPipeline
 *
 * A pipeline that connects to an RTSP server over a WebSocket connection and
 * can process JPEG RTP data to produce an motion JPEG data stream that is sent
 * to a HTML canvas element.
 *
 * Handlers that can be set on the pipeline:
 * - all handlers inherited from the RtspMjpegPipeline
 * - `onSync`: called when the NTP time of the first frame is known, with the
 *   timestamp as argument (the timestamp is UNIX milliseconds)
 * - `onServerClose`: called when the WebSocket server closes the connection
 *   (only then, not when the connection is closed in a different way)
 */
export class Html5CanvasPipeline extends RtspMjpegPipeline {
  public onCanplay?: () => void
  public onSync?: (ntpPresentationTime: number) => void
  public onServerClose?: () => void
  public ready: Promise<void>

  private _src?: WSSource
  private readonly _sink: CanvasSink

  constructor(config: Html5CanvasConfig) {
    const {
      ws: wsConfig,
      rtsp: rtspConfig,
      mediaElement,
      auth: authConfig,
    } = config

    super(rtspConfig)

    if (authConfig) {
      const auth = new Auth(authConfig)
      this.insertBefore(this.rtsp, auth)
    }

    const canvasSink = new CanvasSink(mediaElement)
    canvasSink.onCanplay = () => {
      canvasSink.play()
      this.onCanplay && this.onCanplay()
    }
    canvasSink.onSync = (ntpPresentationTime) => {
      this.onSync && this.onSync(ntpPresentationTime)
    }
    this.append(canvasSink)
    this._sink = canvasSink

    const waitForWs = WSSource.open(wsConfig)
    this.ready = waitForWs.then((wsSource) => {
      wsSource.onServerClose = () => {
        this.onServerClose && this.onServerClose()
      }
      this.prepend(wsSource)
      this._src = wsSource
    })
  }

  close() {
    this.rtsp.stop()
    this._src && this._src.outgoing.end()
  }

  get currentTime() {
    return this._sink.currentTime
  }

  play() {
    return this._sink.play()
  }

  pause() {
    return this._sink.pause()
  }

  get bitrate() {
    return this._sink.bitrate
  }

  get framerate() {
    return this._sink.framerate
  }
}
