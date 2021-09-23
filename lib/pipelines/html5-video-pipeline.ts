import { RtspMp4Pipeline } from './rtsp-mp4-pipeline'
import { RtspConfig } from '../components/rtsp-session'
import { WSConfig } from '../components/ws-source/openwebsocket'
import { MseSink } from '../components/mse'
import { WSSource } from '../components/ws-source'
import { AuthConfig, Auth } from '../components/auth'
import { MediaTrack } from '../utils/protocols/isom'

export interface Html5VideoConfig {
  ws?: WSConfig
  rtsp?: RtspConfig
  mediaElement: HTMLVideoElement
  auth?: AuthConfig
}

/*
 * Html5VideoPipeline
 *
 * A pipeline that connects to an RTSP server over a WebSocket connection and
 * can process H.264/AAC RTP data to produce an MP4 data stream that is sent to
 * a HTML video element.
 *
 * Handlers that can be set on the pipeline:
 * - all handlers inherited from the RtspMp4Pipeline
 * - `onServerClose`: called when the WebSocket server closes the connection
 *   (only then, not when the connection is closed in a different way)
 *
 */
export class Html5VideoPipeline extends RtspMp4Pipeline {
  public onSourceOpen?: (mse: MediaSource, tracks: MediaTrack[]) => void
  public onServerClose?: () => void
  public onWsError?: () => void
  public ready: Promise<void>
  public tracks?: MediaTrack[]

  private _src?: WSSource
  private readonly _sink: MseSink

  constructor(config: Html5VideoConfig) {
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

    const mseSink = new MseSink(mediaElement)
    mseSink.onSourceOpen = (mse, tracks) => {
      this.tracks = tracks
      this.onSourceOpen && this.onSourceOpen(mse, tracks)
    }
    this.append(mseSink)
    this._sink = mseSink

    const waitForWs = WSSource.open(wsConfig)
    this.ready = waitForWs.then((wsSource) => {
      wsSource.incoming.on('error', () => {
        this.onWsError && this.onWsError();
      })
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

  async play() {
    return await this._sink.play()
  }

  pause() {
    return this._sink.pause()
  }
}
