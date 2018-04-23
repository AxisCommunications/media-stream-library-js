const {Transform} = require('stream')
const {Parser} = require('./parser')
const {RAW} = require('../messageTypes')
const rtspBuilder = require('./builder')

const Component = require('../component')

/**
 * A component that converts raw binary data into RTP/RTSP/RTCP packets on the
 * incoming stream, and converts RTSP commands to raw binary data on the outgoing
 * stream. The component is agnostic of any RTSP session details (you need an
 * RTSP session component in the pipeline).
 * @extends {Component}
 */
class RtspParserComponent extends Component {
  /**
   * Create a new RTSP parser component.
   * @return {undefined}
   */
  constructor () {
    const parser = new Parser()

    // Incoming stream
    const incoming = new Transform({
      objectMode: true,
      transform: function (msg, encoding, callback) {
        if (msg.type === RAW) {
          parser.parse(msg.data).forEach((message) => incoming.push(message))
          callback()
        } else {
          // Not a message we should handle
          callback(null, msg)
        }
      }
    })

    // Outgoing stream
    // Steven: I would keep the transform wrapper explicit here, and e.g. only
    // take RTSP-type messages.

    const outgoing = new Transform({
      objectMode: true,
      transform: rtspBuilder
    })

    super(incoming, outgoing)
  }
}

module.exports = RtspParserComponent
