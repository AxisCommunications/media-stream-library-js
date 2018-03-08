const { Transform } = require('stream')
const { Rtp } = require('../../utils/protocols')
const { SDP, RTP } = require('../messageTypes')
const h264depay = require('./h264depay')
const Component = require('../component')

class H264DepayComponent extends Component {
  constructor () {
    let H264PayloadType = 96 // default for Axis cameras

    // Incoming

    let buffer = Buffer.alloc(0)
    let parseMessage

    const incoming = new Transform({
      objectMode: true,
      transform (msg, encoding, callback) {
        // Get correct payload types from sdp to identify video and audio
        if (msg.type === SDP) {
          msg.sdp.media.forEach(media => {
            if (media.type === 'video') {
              H264PayloadType = Number(media.rtpmap.payloadType) || H264PayloadType
            }
          })
          callback(null, msg) // Pass on the original SDP message
        } else if (msg.type === RTP && Rtp.payloadType(msg.data) === H264PayloadType) {
          buffer = parseMessage(buffer, msg)
          callback()
        } else {
          // Not a message we should handle
          callback(null, msg)
        }
      }
    })
    const callback = incoming.push.bind(incoming)
    parseMessage = (buffer, rtp) => h264depay(buffer, rtp, callback)

    // outgoing will be defaulted to a PassThrough stream
    super(incoming)
  }
}

module.exports = H264DepayComponent
