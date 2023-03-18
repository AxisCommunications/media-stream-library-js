import { Tube } from '../components/component'
import { MessageType, XmlMessage } from '../components/message'
import { ONVIFDepay } from '../components/onvifdepay'

import { Html5VideoConfig, Html5VideoPipeline } from './html5-video-pipeline'

export interface Html5VideoMetadataConfig extends Html5VideoConfig {
  metadataHandler: (msg: XmlMessage) => void
}

/*
 * Html5VideoPipeline
 *
 * A pipeline that connects to an RTSP server over a WebSocket connection and
 * can process H.264/AAC RTP data to produce an MP4 data stream that is sent to
 * a HTML video element.  Additionally, this pipeline passes XML metadata sent
 * in the same stream to a separate handler.
 *
 * Handlers that can be set on the pipeline:
 * - all handlers inherited from the Html5VideoPipeline
 */
export class Html5VideoMetadataPipeline extends Html5VideoPipeline {
  constructor(config: Html5VideoMetadataConfig) {
    const { metadataHandler } = config

    super(config)

    const onvifDepay = new ONVIFDepay()
    this.insertAfter(this.rtsp, onvifDepay)

    const onvifHandlerPipe = Tube.fromHandlers((msg) => {
      if (msg.type === MessageType.XML) {
        metadataHandler(msg)
      }
    }, undefined)
    this.insertAfter(onvifDepay, onvifHandlerPipe)
  }
}
