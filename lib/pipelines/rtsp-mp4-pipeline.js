const RtspPipeline = require('./rtsp-pipeline')

const H264Depay = require('../components/h264depay')
const AACDepay = require('../components/aacdepay')
const Mp4Muxer = require('../components/mp4muxer')

class RtspMp4Pipeline extends RtspPipeline {
  /**
   * Create a pipeline which is a linked list of components.
   * Works naturally with only a single component.
   * @param {Array} components The ordered components of the pipeline
   */
  constructor (rtspConfig) {
    super(rtspConfig)

    const h264Depay = new H264Depay()
    const aacDepay = new AACDepay()
    const mp4Muxer = new Mp4Muxer()

    this.append(h264Depay, aacDepay, mp4Muxer)
  }
}

module.exports = RtspMp4Pipeline
