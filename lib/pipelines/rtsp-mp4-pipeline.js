const RtspPipeline = require('./rtsp-pipeline')

const H264Depay = require('../components/h264depay')
const AACDepay = require('../components/aacdepay')
const Mp4Muxer = require('../components/mp4muxer')

/**
 * A pipeline that deals with H264/AAC encoded video
 * sent over RTP, and converts it to streaming MP4
 * format.
 *
 * The following handlers can be defined:
 * - onSync: called when the NTP time of the first frame
 *           is known, with the timestamp as argument
 *           (the timestamp is UNIX milliseconds)
 */
class RtspMp4Pipeline extends RtspPipeline {
  constructor (rtspConfig) {
    super(rtspConfig)

    const h264Depay = new H264Depay()
    const aacDepay = new AACDepay()
    const mp4Muxer = new Mp4Muxer()

    mp4Muxer.onSync = (ntpPresentationTime) => {
      this.onSync && this.onSync(ntpPresentationTime)
    }

    this.append(h264Depay, aacDepay, mp4Muxer)

    this._mp4Muxer = mp4Muxer
  }

  get bitrate () {
    return this._mp4Muxer.bitrate
  }

  get framerate () {
    return this._mp4Muxer.framerate
  }
}

module.exports = RtspMp4Pipeline
