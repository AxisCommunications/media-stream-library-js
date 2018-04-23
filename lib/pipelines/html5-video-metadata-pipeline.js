const Html5VideoPipeline = require('./html5-video-pipeline')

const OnvifDepay = require('../components/onvifdepay')

/**
 * Pipeline that can receive H264/AAC video over RTP
 * over WebSocket and pass it to a video element.
 * Additionally, this pipeline passes XML metadata sent
 * in the same stream to a handler.
 */
class Html5VideoMetadataPipeline extends Html5VideoPipeline {
  constructor (config = {}) {
    const { metadataHandler } = config

    super(config)

    const onvifDepay = new OnvifDepay(metadataHandler)
    this.insertAfter(this.session, onvifDepay)
  }
}

module.exports = Html5VideoMetadataPipeline
