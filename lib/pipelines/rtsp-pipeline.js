const Pipeline = require('./pipeline')

const RtspParser = require('../components/rtsp-parser')
const RtspSession = require('../components/rtsp-session')

class RtspPipeline extends Pipeline {
  /**
   * Create a pipeline which is a linked list of components.
   * Works naturally with only a single component.
   * @param {Array} components The ordered components of the pipeline
   */
  constructor (rtspConfig) {
    const rtspParser = new RtspParser()
    const rtspSession = new RtspSession(rtspConfig)

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
