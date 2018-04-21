const RtspMp4Pipeline = require('./rtsp-mp4-pipeline')

const WebSocketSrc = require('../components/websocket')
const MseSink = require('../components/mse')

/**
 * Pipeline that can receive H264/AAC video over RTP
 * over WebSocket and pass it to a video element.
 */
class Html5VideoPipeline extends RtspMp4Pipeline {
  constructor (config = {}) {
    const {ws: wsConfig, rtsp: rtspConfig, videoEl} = config

    super(rtspConfig)

    const waitForWs = WebSocketSrc.open(wsConfig)
    const mseSink = new MseSink(videoEl)

    this.ready = waitForWs.then((webSocketSrc) => {
      webSocketSrc.onServerClose = () => {
        this.onServerClose && this.onServerClose()
      }
      this.prepend(webSocketSrc)
      this.webSocketSrc = webSocketSrc

      mseSink.onSourceOpen = () => {
        this.onSourceOpen && this.onSourceOpen()
      }
      this.append(mseSink)
    })
  }

  close () {
    this.ready.then(() => {
      this.webSocketSrc.outgoing.end()
    })
  }
}

module.exports = Html5VideoPipeline
