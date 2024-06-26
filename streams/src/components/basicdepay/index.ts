import {
  marker,
  payload,
  payloadType,
  timestamp,
} from '../../utils/protocols/rtp'
import { Tube } from '../component'
import { Message, MessageType } from '../message'
import { createTransform } from '../messageStreams'

export class BasicDepay extends Tube {
  constructor(rtpPayloadType: number) {
    if (rtpPayloadType === undefined) {
      throw new Error('you must supply a payload type to BasicDepayComponent')
    }

    let buffer = Buffer.alloc(0)

    const incoming = createTransform(function (
      msg: Message,
      encoding,
      callback
    ) {
      if (
        msg.type === MessageType.RTP &&
        payloadType(msg.data) === rtpPayloadType
      ) {
        const rtpPayload = payload(msg.data)
        buffer = Buffer.concat([buffer, rtpPayload])

        if (marker(msg.data)) {
          if (buffer.length > 0) {
            this.push({
              data: buffer,
              timestamp: timestamp(msg.data),
              ntpTimestamp: msg.ntpTimestamp,
              payloadType: payloadType(msg.data),
              type: MessageType.ELEMENTARY,
            })
          }
          buffer = Buffer.alloc(0)
        }
        callback()
      } else {
        // Not a message we should handle
        callback(undefined, msg)
      }
    })

    // outgoing will be defaulted to a PassThrough stream
    super(incoming)
  }
}
