const {Transform} = require('stream')
const {Rtp} = require('../../utils/protocols')
const {SDP, RTP, JPEG} = require('../messageTypes')
const Component = require('../component')
const jpegDepayFactory = require('./jpegdepay')

class JPEGDepayComponent extends Component {
  constructor () {
    let payloadType
    let packets = []
    let jpegDepay

    const incoming = new Transform({
      objectMode: true,
      transform (msg, encoding, callback) {
        if (msg.type === SDP) {
          payloadType = Number(msg.sdp.media[0].rtpmap.payloadType)
          const framesize = msg.sdp.media[0].framesize
          const [width, height] = framesize.split(' ')[1].split('-').map(Number)
          msg.framesize = {width, height}

          console.log(width, height)

          jpegDepay = jpegDepayFactory(width, height)

          callback(null, msg)
        } else if (msg.type === RTP && Rtp.payloadType(msg.data) === payloadType) {
          packets.push(msg.data)

          // JPEG over RTP uses the RTP marker bit to indicate end
          // of fragmentation. At this point, the packets can be used
          // to reconstruct a JPEG frame.
          if (Rtp.marker(msg.data) && packets.length > 0) {
            const jpegFrame = jpegDepay(packets)
            this.push({
              data: jpegFrame,
              timestamp: Rtp.timestamp(msg.data),
              ntpTimestamp: msg.ntpTimestamp,
              payloadType: Rtp.payloadType(msg.data),
              type: JPEG
            })
            packets = []
          }
          callback()
        } else {
          // Not a message we should handle
          callback(null, msg)
        }
      }
    })

    // outgoing will be defaulted to a PassThrough stream
    super(incoming)
  }
}

module.exports = JPEGDepayComponent
