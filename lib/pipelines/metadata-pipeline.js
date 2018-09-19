const RtspPipeline = require('./rtsp-pipeline')

const WebSocketSrc = require('../components/websocket')
const OnvifDepay = require('../components/onvifdepay')

// Default configuration for XML event stream
const DEFAULT_RTSP_PARAMETERS = {
  parameters: ['audio=0', 'video=0', 'event=on', 'ptz=all']
}

/**
 * Pipeline that can receive XML metadata over RTP
 * over WebSocket and pass it to a handler.
 */
class MetadataPipeline extends RtspPipeline {
  constructor (config = {}) {
    const { ws: wsConfig, rtsp: rtspConfig, metadataHandler } = config

    super(Object.assign({}, DEFAULT_RTSP_PARAMETERS, rtspConfig))

    const onvifDepay = new OnvifDepay(metadataHandler)
    this.append(onvifDepay)

    const waitForWs = WebSocketSrc.open(wsConfig)
    this.ready = waitForWs.then((webSocketSrc) => {
      webSocketSrc.onServerClose = () => {
        this.onServerClose && this.onServerClose()
      }
      this.prepend(webSocketSrc)
      this._src = webSocketSrc
    })
  }

  close () {
    this._src && this._src.outgoing.end()
  }
}

module.exports = MetadataPipeline
