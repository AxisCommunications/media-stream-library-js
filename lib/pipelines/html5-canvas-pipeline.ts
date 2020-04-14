import { RtspMjpegPipeline } from './rtsp-mjpeg-pipeline'
import { WSConfig } from '../components/ws-source/openwebsocket'
import { RtspConfig } from '../components/rtsp-session'
import { CanvasSink } from '../components/canvas'
import { WSSource } from '../components/ws-source'
import { AuthConfig, Auth } from '../components/auth'

export interface Html5CanvasConfig {
  ws?: WSConfig
  rtsp?: RtspConfig
  mediaElement: HTMLCanvasElement
  auth?: AuthConfig
}

/**
 * Pipeline that can receive Motion JPEG over RTP over WebSocket
 * and display it on a canvas.
 *
 * Handlers that can be set on the pipeline:
 * - onCanplay: called when the first frame is ready, at this point
 *   you can call the play method to start playback.
 *   Note: the default is to autoplay, so call .pause() inside
 *   your onCanplay function if you want to prevent this.
 * - onSync: called when UNIX time (milliseconds) is available
 *   for the start of the presentation.
 *
 * @class Html5CanvasPipeline
 * @extends {RtspMjpegPipeline}
 */
export class Html5CanvasPipeline extends RtspMjpegPipeline {
  public onCanplay?: () => void
  public onSync?: (ntpPresentationTime: number) => void
  public onServerClose?: () => void
  public ready: Promise<void>

  private _src?: WSSource
  private _sink: CanvasSink

  /**
   * Creates an instance of Html5CanvasPipeline.
   * @param {any} [config={}] Component options
   * @memberof Html5CanvasPipeline
   */
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
