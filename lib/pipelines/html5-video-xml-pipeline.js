const Html5VideoPipeline = require('./html5-video-pipeline')

const BasicDepay = require('../components/basicdepay')
const XmlParser = require('../components/xml-parser')

const XML_PAYLOAD_TYPE = 98

// DEPRECATED: replaced with html5-video-metadata-pipeline.js
class Html5VideoXmlPipeline extends Html5VideoPipeline {
  /**
   * Create a pipeline which is a linked list of components.
   * Works naturally with only a single component.
   * @param {Array} components The ordered components of the pipeline
   */
  constructor (config) {
    console.warn('deprecated pipeline, may disappear next release')
    super(config)

    const xmlDepay = new BasicDepay(XML_PAYLOAD_TYPE)
    const xmlParser = new XmlParser()

    this.insertAfter(this.session, xmlDepay)
    this.insertAfter(xmlDepay, xmlParser)
  }
}

module.exports = Html5VideoXmlPipeline
