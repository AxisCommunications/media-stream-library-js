const {
  H264Depay,
  AACDepay,
  WebSocket,
  RtspParser,
  RtspSession,
  Mp4Muxer,
  Mp4Capture,
  Mse
} = require('../components/index.browser')

class WebSocketRtspVideo {
  /**
   * Generate a websocket-rtsp-video pipeline.
   * @param  {Object} [config={}] General configuration
   * @param  {Object} [config.ws] Websocket configuration
   * @param  {Object} [config.rtsp] RTSP configuration
   * @param  {Object} config.videoEl Media source configuration
   * @return {undefined}
   */
  constructor (config = {}) {
    const {ws: wsConfig, rtsp: rtspConfig, videoEl} = config

    const waitForWs = WebSocket.open(wsConfig)

    const rtspParser = new RtspParser()
    const rtspSession = new RtspSession(rtspConfig)
    const h264Depay = new H264Depay()
    const aacDepay = new AACDepay()
    const mp4Muxer = new Mp4Muxer()
    const mp4Capture = new Mp4Capture()
    const mediaSource = new Mse(videoEl)

    this.ready = waitForWs.then((webSocket) => {
      webSocket
        .connect(rtspParser)
        .connect(rtspSession)
        .connect(h264Depay)
        .connect(aacDepay)
        .connect(mp4Muxer)
        .connect(mp4Capture)
        .connect(mediaSource)

      return {
        webSocket,
        rtspParser,
        rtspSession,
        h264Depay,
        aacDepay,
        mp4Muxer,
        mp4Capture,
        mediaSource
      }
    })

    // Expose RTSP session as a controller
    this.rtspSession = rtspSession
  }

  close () {
    this.ready.then(({webSocket}) => {
      // Force close the entire pipeline, this ends all.
      //
      // Used for now to easily replace the whole pipeline
      // and make a new pipeline, but ideally this should not
      // be needed and instead a pipeline should be reused for
      // different RTSP streams.
      webSocket.outgoing.end()
    })
  }
}

module.exports = WebSocketRtspVideo
