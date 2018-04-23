const Pipeline = require('./pipeline')

const RtspParser = require('../components/rtsp-parser')
const RtspSession = require('../components/rtsp-session')

/**
 * A pipeline that converts interleaved RTSP/RTP
 * into a series of RTP, RTCP, and RTSP packets.
 * The pipeline exposes the RTSP session component
 * as `this.session`, and wraps its play, pause
 * and stop methods.
 */
class RtspPipeline extends Pipeline {
  constructor (rtspConfig) {
    const rtspParser = new RtspParser()
    const rtspSession = new RtspSession(rtspConfig)

    rtspSession.onSdp = (sdp) => {
      this.onSdp && this.onSdp(sdp)
    }

    rtspSession.onPlay = (range) => {
      this.onPlay && this.onPlay(range)
    }

    super(rtspParser, rtspSession)

    this.session = rtspSession
  }

  play (startTime) {
    this.session.play(startTime)
  }

  pause () {
    this.session.pause()
  }

  stop () {
    this.session.stop()
  }
}

module.exports = RtspPipeline
