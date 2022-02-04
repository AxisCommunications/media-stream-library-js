import { RtspConfig, RTSP_METHOD } from '../components/rtsp-session'
import { WSConfig } from '../components/ws-source/openwebsocket'
import { WSSource } from '../components/ws-source'
import { AuthConfig, Auth } from '../components/auth'
import { RtspPipeline } from './rtsp-pipeline'
import { Sdp } from '../utils/protocols'

export interface TransformConfig {
  ws?: WSConfig
  rtsp?: RtspConfig
  auth?: AuthConfig
}

/**
 * WsSdpPipeline
 *
 * Pipeline requesting an SDP object from an RTSP server and then
 * immediately tears down the RTSP session.
 */
export class WsSdpPipeline extends RtspPipeline {
  public onServerClose?: () => void
  public ready: Promise<void>

  private _src?: WSSource

  constructor(config: TransformConfig) {
    const { ws: wsConfig, rtsp: rtspConfig, auth: authConfig } = config

    super(rtspConfig)

    if (authConfig) {
      const auth = new Auth(authConfig)
      this.insertBefore(this.rtsp, auth)
    }

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

  get sdp() {
    return this.ready.then(async () => {
      const sdpPromise = new Promise<Sdp>((resolve) => {
        this.rtsp.onSdp = resolve
      })
      this.rtsp.send({ method: RTSP_METHOD.DESCRIBE })
      this.rtsp.send({ method: RTSP_METHOD.TEARDOWN })
      return await sdpPromise
    })
  }
}
