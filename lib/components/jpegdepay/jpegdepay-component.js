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
      transform: function (msg, encoding, callback) {
        if (msg.type === SDP) {
          const jpegMedia = msg.sdp.media.find(media => {
            return (
              media.type === 'video' &&
              media.rtpmap &&
              media.rtpmap.encodingName === 'JPEG'
            )
          })
          if (jpegMedia) {
            payloadType = Number(jpegMedia.rtpmap.payloadType)
            const framesize = jpegMedia.framesize
            // `framesize` is an SDP field that is present in e.g. Axis camera's
            // and is used because the width and height that can be sent inside
            // the JPEG header are both limited to 2040.
            // If present, we use this width and height as the default values
            // to be used by the jpeg depay function, otherwise we ignore this
            // and let the JPEG header inside the RTP packets determine this.
            if (framesize) {
              const [width, height] = framesize.split(' ')[1].split('-').map(Number)
              msg.framesize = {width, height}
              jpegDepay = jpegDepayFactory(width, height)
            } else {
              jpegDepay = jpegDepayFactory()
            }
          }

          callback(null, msg)
        } else if (msg.type === RTP && Rtp.payloadType(msg.data) === payloadType) {
          packets.push(msg.data)

          // JPEG over RTP uses the RTP marker bit to indicate end
          // of fragmentation. At this point, the packets can be used
          // to reconstruct a JPEG frame.
          if (Rtp.marker(msg.data) && packets.length > 0) {
            const jpegFrame = jpegDepay(packets)
            this.push({
              timestamp: Rtp.timestamp(msg.data),
              ntpTimestamp: msg.ntpTimestamp,
              payloadType: Rtp.payloadType(msg.data),
              data: jpegFrame.data,
              framesize: jpegFrame.size,
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
