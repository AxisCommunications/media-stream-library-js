const RtspMjpegPipeline = require('./rtsp-mjpeg-pipeline')

const WebSocketSrc = require('../components/websocket')
const CanvasSink = require('../components/canvas')

/**
 * Pipeline that can receive Motion JPEG over RTP over WebSocket
 * and display it on a canvas.
 *
 * Handlers that can be set on the pipeline:
 * - onCanplay: called when the first frame is ready, at this point
 *   you can call the play method to start playback.
 *   Note: the default is to autoplay, so call .pause() inside
 *   your onCanplay function if you want to prevent this.
 * - onSync: called when UNIX time (milliseconds) is available
 *   for the start of the presentation.
 *
 * @class Html5CanvasPipeline
 * @extends {RtspMjpegPipeline}
 */
class Html5CanvasPipeline extends RtspMjpegPipeline {
  /**
   * Creates an instance of Html5CanvasPipeline.
   * @param {any} [config={}] Component options
   * @memberof Html5CanvasPipeline
   */
  constructor (config = {}) {
    const {ws: wsConfig, rtsp: rtspConfig, mediaElement} = config

    super(rtspConfig)

    const canvasSink = new CanvasSink(mediaElement)
    canvasSink.onCanplay = () => {
      canvasSink.play()
      this.onCanplay && this.onCanplay()
    }
    canvasSink.onSync = (ntpPresentationTime) => {
      this.onSync && this.onSync(ntpPresentationTime)
    }
    this.append(canvasSink)
    this._sink = canvasSink

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

  get bitrate () {
    return this._sink.bitrate
  }

  get framerate () {
    return this._sink.framerate
  }
}

module.exports = Html5CanvasPipeline
