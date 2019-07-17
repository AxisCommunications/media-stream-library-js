import { RtspPipeline } from './rtsp-pipeline'
import { ONVIFDepay } from '../components/onvifdepay'
import { TcpSource } from '../components/tcp'
import { RtspConfig } from '../components/rtsp-session'
import { AuthConfig, Auth } from '../components/auth'
import { XmlMessage } from '../components/message'

// Default configuration for XML event stream
const DEFAULT_RTSP_PARAMETERS = {
  parameters: ['audio=0', 'video=0', 'event=on', 'ptz=all'],
}

export interface RtspAuthMetadataConfig {
  rtsp?: RtspConfig
  auth?: AuthConfig
  metadataHandler: (msg: XmlMessage) => void
}

/**
 * Pipeline that can receive XML metadata over RTP
 * over WebSocket and pass it to a handler.
 */
export class CliMetadataPipeline extends RtspPipeline {
  public onServerClose?: () => void

  private _src?: TcpSource

  constructor(config: RtspAuthMetadataConfig) {
    const { rtsp: rtspConfig, auth: authConfig, metadataHandler } = config

    super(Object.assign({}, DEFAULT_RTSP_PARAMETERS, rtspConfig))

    const tcpSource = new TcpSource()
    this.prepend(tcpSource)
    this._src = tcpSource

    const onvifDepay = new ONVIFDepay(metadataHandler)
    this.append(onvifDepay)
  }

  close() {
    this._src && this._src.outgoing.end()
  }
}
