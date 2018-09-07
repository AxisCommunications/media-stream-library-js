const {
  H264Depay,
  AACDepay,
  BasicDepay,
  XmlParser,
  WebSocket,
  RtspParser,
  RtspSession,
  Mp4Muxer,
  Mp4Capture,
  Mse
} = require('../components/index.browser')

const { XML } = require('../components/messageTypes')

const XML_PAYLOAD_TYPE = 98

// DEPRECATED
class WebSocketRtspVideoXml {
  /**
   * Generate a websocket-rtsp-video pipeline.
   * @param  {Object} [config={}] General configuration
   * @param  {Object} [config.ws] Websocket configuration
   * @param  {Object} [config.rtsp] RTSP configuration
   * @param  {Object} config.videoEl Media source configuration
   * @return {undefined}
   */
  constructor (config = {}) {
    console.warn('deprecated pipeline, may disappear next release')
    const { ws: wsConfig, rtsp: rtspConfig, videoEl } = config

    const waitForWs = WebSocket.open(wsConfig)

    const rtspParser = new RtspParser()
    const rtspSession = new RtspSession(rtspConfig)
    const h264Depay = new H264Depay()
    const aacDepay = new AACDepay()
    const xmlDepay = new BasicDepay(XML_PAYLOAD_TYPE)
    const xmlParser = new XmlParser()
    const mp4Muxer = new Mp4Muxer()
    const mp4Capture = new Mp4Capture()
    const mediaSource = new Mse(videoEl)

    this.ready = waitForWs.then((webSocket) => {
      webSocket
        .connect(rtspParser)
        .connect(rtspSession)
        .connect(h264Depay)
        .connect(aacDepay)
        .connect(xmlDepay)
        .connect(xmlParser)
        .connect(mp4Muxer)
        .connect(mp4Capture)
        .connect(mediaSource)

      return {
        webSocket,
        rtspParser,
        rtspSession,
        h264Depay,
        aacDepay,
        xmlDepay,
        xmlParser,
        mp4Muxer,
        mp4Capture,
        mediaSource
      }
    })

    // Expose RTSP session as a controller
    this.rtspSession = rtspSession
    this.mediaSource = mediaSource
  }

  close () {
    this.ready.then(({ webSocket }) => {
      // Force close the entire pipeline, this ends all.
      //
      // Used for now to easily replace the whole pipeline
      // and make a new pipeline, but ideally this should not
      // be needed and instead a pipeline should be reused for
      // different RTSP streams.
      webSocket.outgoing.end()
    })
  }

  addXmlHandler (cb) {
    this.mediaSource.registerHandler(XML, cb)
  }

  removeXmlHandler () {
    this.mediaSource.unregisterHandler(XML)
  }
}

module.exports = WebSocketRtspVideoXml
