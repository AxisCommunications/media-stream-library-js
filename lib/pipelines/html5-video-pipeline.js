const RtspMp4Pipeline = require('./rtsp-mp4-pipeline')

const WebSocketSrc = require('../components/websocket')
const MseSink = require('../components/mse')

class Html5VideoPipeline extends RtspMp4Pipeline {
  /**
   * Create a pipeline which is a linked list of components.
   * Works naturally with only a single component.
   * @param {Array} components The ordered components of the pipeline
   */
  constructor (config = {}) {
    const {ws: wsConfig, rtsp: rtspConfig, videoEl} = config

    super(rtspConfig)

    const waitForWs = WebSocketSrc.open(wsConfig)
    const mseSink = new MseSink(videoEl)

    this.ready = waitForWs.then((webSocketSrc) => {
      this.prepend(webSocketSrc)
      this.append(mseSink)
    })
  }
}

module.exports = Html5VideoPipeline
