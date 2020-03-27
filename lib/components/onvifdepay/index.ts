import { Tube } from '../component'
import { Transform } from 'stream'
import { MessageType, Message, XmlMessage } from '../message'
import {
  payloadType,
  payload,
  marker,
  timestamp,
} from '../../utils/protocols/rtp'

export class ONVIFDepay extends Tube {
  constructor() {
    let XMLPayloadType: number
    let packets: Buffer[] = []

    const incoming = new Transform({
      objectMode: true,
      transform: function (msg: Message, encoding, callback) {
        if (msg.type === MessageType.SDP) {
          let validMedia
          for (const media of msg.sdp.media) {
            if (
              media.type === 'application' &&
              media.rtpmap &&
              media.rtpmap.encodingName === 'VND.ONVIF.METADATA'
            ) {
              validMedia = media
            }
          }
          if (validMedia && validMedia.rtpmap) {
            XMLPayloadType = Number(validMedia.rtpmap.payloadType)
          }
          callback(undefined, msg)
        } else if (
          msg.type === MessageType.RTP &&
          payloadType(msg.data) === XMLPayloadType
        ) {
          // Add payload to packet stack
          packets.push(payload(msg.data))

          // XML over RTP uses the RTP marker bit to indicate end
          // of fragmentation. At this point, the packets can be used
          // to reconstruct an XML packet.
          if (marker(msg.data) && packets.length > 0) {
            const xmlMsg: XmlMessage = {
              timestamp: timestamp(msg.data),
              ntpTimestamp: msg.ntpTimestamp,
              payloadType: payloadType(msg.data),
              data: Buffer.concat(packets),
              type: MessageType.XML,
            }
            callback(undefined, xmlMsg)
            packets = []
            return
          }
          callback()
        } else {
          // Not a message we should handle
          callback(undefined, msg)
        }
      },
    })

    // outgoing will be defaulted to a PassThrough stream
    super(incoming)
  }
}
