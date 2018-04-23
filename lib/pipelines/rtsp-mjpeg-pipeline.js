const RtspPipeline = require('./rtsp-pipeline')

const JpegDepay = require('../components/jpegdepay')

/**
 * A pipeline that deals with JPEG encoded video
 * sent over RTP, and converts it to motion JPEG
 * format.
 */
class RtspMjpegPipeline extends RtspPipeline {
  constructor (rtspConfig) {
    super(rtspConfig)

    const jpegDepay = new JpegDepay()

    this.append(jpegDepay)
  }
}

module.exports = RtspMjpegPipeline
