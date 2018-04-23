const RtspPipeline = require('./rtsp-pipeline')

const H264Depay = require('../components/h264depay')
const AACDepay = require('../components/aacdepay')
const Mp4Muxer = require('../components/mp4muxer')

/**
 * A pipeline that deals with H264/AAC encoded video
 * sent over RTP, and converts it to streaming MP4
 * format.
 *
 * The pipeline wraps the MP4 muxer `onSync` method,
 * which can be used to be notified of the NTP timestamp
 * corresponding to the beginning of the movie.
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
  }
}

module.exports = RtspMp4Pipeline
