const RtspMp4Pipeline = require('./rtsp-mp4-pipeline')

const WebSocketSrc = require('../components/websocket')
const MseSink = require('../components/mse')

/**
 * Pipeline that can receive H264/AAC video over RTP
 * over WebSocket and pass it to a video element.
 *
 * @class Html5VideoPipeline
 * @extends {RtspMp4Pipeline}
 */
class Html5VideoPipeline extends RtspMp4Pipeline {
  /**
   * Creates an instance of Html5VideoPipeline.
   * @param {any} [config={}] Component options
   * @memberof Html5VideoPipeline
   */
  constructor (config = {}) {
    const {ws: wsConfig, rtsp: rtspConfig, mediaElement} = config

    super(rtspConfig)

    const mseSink = new MseSink(mediaElement)
    mseSink.onSourceOpen = () => {
      this.onSourceOpen && this.onSourceOpen()
    }
    this.append(mseSink)
    this._sink = mseSink

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

  get currentTime () {
    return this._sink.currentTime
  }

  play () {
    return this._sink.play()
  }

  pause () {
    return this._sink.pause()
  }
}

module.exports = Html5VideoPipeline
