import {
  ElementaryMessage,
  H264Message,
  JpegMessage,
  RtpMessage,
  SdpMessage,
  XmlMessage,
} from '../types'

import { AACDepay } from './aac-depay'
import { H264Depay } from './h264-depay'
import { JPEGDepay } from './jpeg-depay'
import { ONVIFDepay } from './onvif-depay'

type PayloadMessage = H264Message | ElementaryMessage | XmlMessage | JpegMessage
type ParserMap = Partial<
  Record<number, (rtp: RtpMessage) => PayloadMessage | undefined>
>

export class RtpDepay extends TransformStream<
  SdpMessage | RtpMessage,
  SdpMessage | PayloadMessage
> {
  private peeker?: {
    types: PayloadMessage['type'][]
    cb: (msg: PayloadMessage) => void
  }

  constructor() {
    const payloadTypeParser: ParserMap = {}

    super({
      transform: (msg, controller) => {
        switch (msg.type) {
          case 'sdp': {
            const media = msg.media
            for (const Depay of [H264Depay, AACDepay, JPEGDepay, ONVIFDepay]) {
              const depay = new Depay(media)
              if (depay.payloadType) {
                payloadTypeParser[depay.payloadType] = (msg: RtpMessage) =>
                  depay.parse(msg)
              }
            }
            return controller.enqueue(msg)
          }
          case 'rtp': {
            const parse = payloadTypeParser[msg.payloadType]
            if (!parse) {
              return controller.error(
                `no parser for payload type ${msg.payloadType}, expected one of ${Object.keys(payloadTypeParser)}`
              )
            }

            const payloadMessage = parse(msg)
            if (!payloadMessage) {
              return
            }

            if (this.peeker?.types.includes(payloadMessage.type)) {
              this.peeker.cb(payloadMessage)
            }

            return controller.enqueue(payloadMessage)
          }
        }
      },
    })
  }

  /** Register a function that will peek at payload messages
   * for the given payload types. */
  peek(types: PayloadMessage['type'][], peeker: (msg: PayloadMessage) => void) {
    this.peeker = { types, cb: peeker }
  }
}
