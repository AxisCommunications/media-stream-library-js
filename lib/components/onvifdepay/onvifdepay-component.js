const {Transform} = require('stream')
const {Rtp} = require('../../utils/protocols')
const {SDP, RTP, XML} = require('../messageTypes')
const Component = require('../component')

class ONVIFDepayComponent extends Component {
  constructor (handler) {
    let payloadType
    let packets = []

    const incoming = new Transform({
      objectMode: true,
      transform: function (msg, encoding, callback) {
        if (msg.type === SDP) {
          const xmlMedia = msg.sdp.media.find(media => {
            return (
              media.type === 'application' &&
              media.rtpmap &&
              media.rtpmap.encodingName === 'VND.ONVIF.METADATA'
            )
          })
          if (xmlMedia) {
            payloadType = Number(xmlMedia.rtpmap.payloadType)
          }
          callback(null, msg)
        } else if (msg.type === RTP && Rtp.payloadType(msg.data) === payloadType) {
          // Add payload to packet stack
          packets.push(Rtp.payload(msg.data))

          // XML over RTP uses the RTP marker bit to indicate end
          // of fragmentation. At this point, the packets can be used
          // to reconstruct an XML packet.
          if (Rtp.marker(msg.data) && packets.length > 0) {
            const xmlMsg = {
              timestamp: Rtp.timestamp(msg.data),
              ntpTimestamp: msg.ntpTimestamp,
              payloadType: Rtp.payloadType(msg.data),
              data: Buffer.concat(packets),
              type: XML
            }
            // If there is a handler, the XML message will leave
            // through the handler, otherwise send it on to the
            // next component
            if (handler) {
              handler(xmlMsg)
            } else {
              this.push(xmlMsg)
            }
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

module.exports = ONVIFDepayComponent
