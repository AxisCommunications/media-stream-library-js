const RtspPipeline = require('./rtsp-pipeline')

const JPEGDepay = require('../components/jpegdepay')

class RtspJpegPipeline extends RtspPipeline {
  /**
   * Create a pipeline which is a linked list of components.
   * Works naturally with only a single component.
   * @param {Array} components The ordered components of the pipeline
   */
  constructor (rtspConfig) {
    super(rtspConfig)

    const jpegDepay = new JPEGDepay()

    this.append(jpegDepay)
  }
}

module.exports = RtspJpegPipeline
