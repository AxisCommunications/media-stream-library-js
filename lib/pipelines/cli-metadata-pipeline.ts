import { RtspConfig } from '../components/rtsp-session'
import { TcpSource } from '../components/tcp'
import { RtspPipeline } from './rtsp-pipeline'
import { MessageType, XmlMessage } from '../components/message'
import { AuthConfig, Auth } from '../components/auth'
import { Sink } from '../components/component'
import { ONVIFDepay } from '../components/onvifdepay'

interface CliMetadataConfig {
  rtsp?: RtspConfig
  auth?: AuthConfig
  metadataHandler: (msg: XmlMessage) => void
}

// Default configuration for XML event stream
const DEFAULT_RTSP_PARAMETERS = {
  parameters: ['audio=0', 'video=0', 'event=on', 'ptz=all'],
}

export class CliMetadataPipeline extends RtspPipeline {
  /**
   * Create a pipeline which is a linked list of components.
   * Works naturally with only a single component.
   * @param {Array} components The ordered components of the pipeline
   */
  constructor(config: CliMetadataConfig) {
    const { rtsp: rtspConfig, auth: authConfig, metadataHandler } = config

    super(Object.assign({}, DEFAULT_RTSP_PARAMETERS, rtspConfig))

    const auth = new Auth(authConfig)
    this.insertBefore(this.rtsp, auth)

    const onvifDepay = new ONVIFDepay()
    this.append(onvifDepay)

    const handlerSink = Sink.fromHandler((msg) => {
      if (msg.type === MessageType.XML) {
        metadataHandler(msg)
      }
    })
    this.append(handlerSink)

    const tcpSource = new TcpSource()
    this.prepend(tcpSource)
  }
}
