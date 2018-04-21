const Html5VideoPipeline = require('./html5-video-pipeline')

const OnvifDepay = require('../components/onvifdepay')

class Html5VideoMetadataPipeline extends Html5VideoPipeline {
  /**
   * Create a pipeline which is a linked list of components.
   * Works naturally with only a single component.
   * @param {Array} components The ordered components of the pipeline
   */
  constructor (config = {}) {
    const { metadataHandler } = config

    super(config)

    const onvifDepay = new OnvifDepay(metadataHandler)
    this.insertAfter(this.session, onvifDepay)
  }
}

module.exports = Html5VideoMetadataPipeline
