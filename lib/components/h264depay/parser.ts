import { RtpMessage, MessageType, H264Message } from '../message'
import { payload, timestamp, payloadType } from '../../utils/protocols/rtp'
import debug from 'debug'

export enum NAL_TYPES {
  UNSPECIFIED = 0,
  NON_IDR_PICTURE = 1, // P-frame
  IDR_PICTURE = 5, // I-frame
  SPS = 7,
  PPS = 8,
}

/*
First byte in payload (rtp payload header):
      +---------------+
      |0|1|2|3|4|5|6|7|
      +-+-+-+-+-+-+-+-+
      |F|NRI|  Type   |
      +---------------+

2nd byte in payload: FU header (if type in first byte is 28)
      +---------------+
      |0|1|2|3|4|5|6|7|
      +-+-+-+-+-+-+-+-+
      |S|E|R|  Type   | S = start, E = end
      +---------------+
*/

const h264Debug = debug('msl:h264depay')

export class H264DepayParser {
  private _buffer: Buffer

  constructor() {
    this._buffer = Buffer.alloc(0)
  }

  parse(rtp: RtpMessage): H264Message | null {
    const rtpPayload = payload(rtp.data)
    const type = rtpPayload[0] & 0x1f

    if (type === 28) {
      /* FU-A NALU */ const fuIndicator = rtpPayload[0]
      const fuHeader = rtpPayload[1]
      const startBit = !!(fuHeader >> 7)
      const nalType = fuHeader & 0x1f
      const nal = (fuIndicator & 0xe0) | nalType
      const stopBit = fuHeader & 64
      if (startBit) {
        this._buffer = Buffer.concat([
          Buffer.from([0, 0, 0, 0, nal]),
          rtpPayload.slice(2),
        ])
        return null
      } else if (stopBit) {
        /* receieved end bit */ const h264frame = Buffer.concat([
          this._buffer,
          rtpPayload.slice(2),
        ])
        h264frame.writeUInt32BE(h264frame.length - 4, 0)
        const msg: H264Message = {
          data: h264frame,
          type: MessageType.H264,
          timestamp: timestamp(rtp.data),
          ntpTimestamp: rtp.ntpTimestamp,
          payloadType: payloadType(rtp.data),
          nalType: nalType,
        }
        this._buffer = Buffer.alloc(0)
        return msg
      } else {
        // Put the received data on the buffer and cut the header bytes
        this._buffer = Buffer.concat([this._buffer, rtpPayload.slice(2)])
        return null
      }
    } else if (
      (type === NAL_TYPES.NON_IDR_PICTURE || type === NAL_TYPES.IDR_PICTURE) &&
      this._buffer.length === 0
    ) {
      /* Single NALU */ const h264frame = Buffer.concat([
        Buffer.from([0, 0, 0, 0]),
        rtpPayload,
      ])
      h264frame.writeUInt32BE(h264frame.length - 4, 0)
      const msg: H264Message = {
        data: h264frame,
        type: MessageType.H264,
        timestamp: timestamp(rtp.data),
        ntpTimestamp: rtp.ntpTimestamp,
        payloadType: payloadType(rtp.data),
        nalType: type,
      }
      this._buffer = Buffer.alloc(0)
      return msg
    } else {
      h264Debug(
        `H264depayComponent can only extract types 1,5 and 28, got ${type}`,
      )
      this._buffer = Buffer.alloc(0)
      return null
    }
  }
}
