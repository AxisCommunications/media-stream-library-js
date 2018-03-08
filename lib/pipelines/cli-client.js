const Pipeline = require('./pipeline')

const H264Depay = require('../components/h264depay')
const AacDepay = require('../components/aacdepay')
const WebSocket = require('../components/websocket')
const RtspParser = require('../components/rtsp-parser')
const RtspSession = require('../components/rtsp-session')
const Mp4Muxer = require('../components/mp4muxer')
const MseComponent = require('../components/mse')
const Auth = require('../components/auth')

const DEFAULT_VIDEO_ELEMENT = document.querySelector('video')

class CliPipeline extends Pipeline {
  constructor (config = {}) {
    const {ws: wsConfig, rtsp: rtspConfig, videoEl, auth: authConfig} = config

    const waitForWs = WebSocket.open(wsConfig)

    const rtspParser = new RtspParser()
    const rtspSession = new RtspSession(rtspConfig)
    const h264Depay = new H264Depay()
    const aacDepay = new AacDepay()
    const mp4Muxer = new Mp4Muxer()
    const mediaSource = new MseComponent(videoEl || DEFAULT_VIDEO_ELEMENT)
    const auth = new Auth(authConfig)

    const ready = waitForWs.then((webSocket) => {
      webSocket
        .connect(rtspParser)
        .connect(auth)
        .connect(rtspSession)
        .connect(h264Depay)
        .connect(aacDepay)
        .connect(mp4Muxer)
        .connect(mediaSource)

      return {
        webSocket,
        rtspParser,
        rtspSession,
        h264Depay,
        aacDepay,
        mp4Muxer,
        mediaSource
      }
    })

    super(ready)

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

module.exports = CliPipeline
