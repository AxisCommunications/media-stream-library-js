const RtspMjpegPipeline = require('./rtsp-mjpeg-pipeline')

const WebSocketSrc = require('../components/websocket')
const CanvasSink = require('../components/canvas')

/**
 * Pipeline that can receive Motion JPEG over RTP over WebSocket
 * and display it on a canvas.
 */
class Html5CanvasPipeline extends RtspMjpegPipeline {
  constructor (config = {}) {
    const {ws: wsConfig, rtsp: rtspConfig, canvasEl} = config

    super(rtspConfig)

    const waitForWs = WebSocketSrc.open(wsConfig)
    const canvasSink = new CanvasSink(canvasEl)

    this.ready = waitForWs.then((webSocketSrc) => {
      webSocketSrc.onServerClose = () => {
        this.onServerClose && this.onServerClose()
      }
      this.prepend(webSocketSrc)
      this.append(canvasSink)
    })
  }

  close () {
    this.ready.then(() => {
      this.webSocketSrc.outgoing.end()
    })
  }
}

module.exports = Html5CanvasPipeline
