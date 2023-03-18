import { Sink } from '../components/component'
import { MessageType, XmlMessage } from '../components/message'
import { ONVIFDepay } from '../components/onvifdepay'
import { RtspConfig } from '../components/rtsp-session'
import { WSSource } from '../components/ws-source'
import { WSConfig } from '../components/ws-source/openwebsocket'

import { RtspPipeline } from './rtsp-pipeline'

// Default configuration for XML event stream
const DEFAULT_RTSP_PARAMETERS = {
  parameters: ['audio=0', 'video=0', 'event=on', 'ptz=all'],
}

export interface WsRtspMetadataConfig {
  ws?: WSConfig
  rtsp?: RtspConfig
  metadataHandler: (msg: XmlMessage) => void
}

/*
 * MetadataPipeline
 *
 * A pipeline that connects to an RTSP server over a WebSocket connection and
 * can process XML RTP data and calls a handler to process the XML messages.
 *
 * Handlers that can be set on the pipeline:
 * - all handlers inherited from the RtspPipeline
 * - `onServerClose`: called when the WebSocket server closes the connection
 *   (only then, not when the connection is closed in a different way)
 */
export class MetadataPipeline extends RtspPipeline {
  public onServerClose?: () => void
  public ready: Promise<void>

  private _src?: WSSource

  constructor(config: WsRtspMetadataConfig) {
    const { ws: wsConfig, rtsp: rtspConfig, metadataHandler } = config

    super(Object.assign({}, DEFAULT_RTSP_PARAMETERS, rtspConfig))

    const onvifDepay = new ONVIFDepay()
    this.append(onvifDepay)
    const handlerSink = Sink.fromHandler((msg) => {
      if (msg.type === MessageType.XML) {
        metadataHandler(msg)
      }
    })
    this.append(handlerSink)

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
}
