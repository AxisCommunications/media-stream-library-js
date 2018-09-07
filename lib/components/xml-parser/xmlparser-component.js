const { Transform } = require('stream')

const Component = require('../component')
const { ELEMENTARY, XML } = require('../messageTypes')

const XML_PAYLOAD_TYPE = 98

class XmlParserComponent extends Component {
  /**
   * Create an XML parser component
   *
   * The constructor sets up an incoming stream to transform XML data
   * from a buffer to an XML document. The document is sent on the
   * transformed message, as the 'doc' property, with message type 'xml'.
   */
  constructor (payloadType = XML_PAYLOAD_TYPE) {
    const xmlParser = new window.DOMParser()

    /**
     * Set up an incoming stream and attach it to the sourceBuffer.
     * @type {Writable}
     */
    const incoming = new Transform({
      objectMode: true,
      transform: function (msg, encoding, callback) {
        if (msg.type === ELEMENTARY && msg.payloadType === payloadType) {
          msg.type = XML
          msg.doc = xmlParser.parseFromString(msg.data.toString(), 'text/xml')
        }
        this.push(msg)
        callback()
      }
    })

    /**
    * initialize the component.
    */
    super(incoming)
  }
}

module.exports = XmlParserComponent
