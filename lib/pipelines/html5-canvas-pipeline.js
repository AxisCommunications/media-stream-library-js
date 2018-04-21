const RtspJpegPipeline = require('./rtsp-jpeg-pipeline')

const WebSocketSrc = require('../components/websocket')
const CanvasSink = require('../components/canvas')

class Html5CanvasPipeline extends RtspJpegPipeline {
  /**
   * Create a pipeline which is a linked list of components.
   * Works naturally with only a single component.
   * @param {Array} components The ordered components of the pipeline
   */
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
