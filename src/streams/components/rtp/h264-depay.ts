import { logWarn } from '../../log'

import { concat, writeUInt32BE } from '../utils/bytes'

import {
  H264Message,
  MediaDescription,
  RtpMessage,
  isH264Media,
} from '../types'

export enum NAL_TYPES {
  UNSPECIFIED = 0,
  NON_IDR_PICTURE = 1, // P-frame
  IDR_PICTURE = 5, // I-frame
  SEI = 6, // Supplemental Enhancement Information
  SPS = 7,
  PPS = 8,
}

const ignoredTypes = new Set<number>()

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

export class H264Depay {
  public payloadType?: number

  private buffer: Uint8Array = new Uint8Array(0)
  private frameFragments: Uint8Array[] = []
  private idrFound: boolean = false

  constructor(media: MediaDescription[]) {
    const h264Media = media.find(isH264Media)
    this.payloadType = h264Media?.rtpmap?.payloadType
  }

  public parse(rtp: RtpMessage): H264Message | undefined {
    const endOfFrame = rtp.marker

    const payload = rtp.data
    const type = payload[0] & 0x1f

    let h264frame: Uint8Array | undefined = undefined
    let nalType = type

    if (type === 28) {
      /* FU-A NALU */ const fuIndicator = payload[0]
      const fuHeader = payload[1]
      const startBit = !!(fuHeader >> 7)
      nalType = fuHeader & 0x1f
      const nal = (fuIndicator & 0xe0) | nalType
      const stopBit = fuHeader & 64
      if (startBit) {
        this.buffer = concat([
          new Uint8Array([0, 0, 0, 0, nal]),
          payload.subarray(2),
        ])
      } else if (stopBit) {
        /* receieved end bit */ h264frame = concat([
          this.buffer,
          payload.subarray(2),
        ])
        writeUInt32BE(h264frame, 0, h264frame.length - 4)
        this.buffer = new Uint8Array(0)
      } else {
        // Put the received data on the buffer and cut the header bytes
        this.buffer = concat([this.buffer, payload.subarray(2)])
      }
    } else if (
      (nalType === NAL_TYPES.NON_IDR_PICTURE ||
        nalType === NAL_TYPES.IDR_PICTURE ||
        nalType === NAL_TYPES.SEI) &&
      this.buffer.length === 0
    ) {
      /* Single NALU */ h264frame = concat([
        new Uint8Array([0, 0, 0, 0]),
        payload,
      ])
      writeUInt32BE(h264frame, 0, h264frame.length - 4)
      this.buffer = new Uint8Array(0)
    } else {
      if (!ignoredTypes.has(type)) {
        ignoredTypes.add(type)
        logWarn(
          `H264depayComponent can only extract types 1, 5 and 28, got ${type} (quietly ignoring from now on)`
        )
      }
      // FIXME: this could probably be removed
      this.buffer = new Uint8Array(0)
    }

    if (h264frame === undefined) {
      return
    }

    this.frameFragments.push(h264frame)

    if (!endOfFrame) {
      return
    }

    if (nalType === NAL_TYPES.IDR_PICTURE) {
      this.idrFound = true
    }

    const frame =
      this.frameFragments.length === 1
        ? this.frameFragments[0]
        : concat(this.frameFragments)
    this.frameFragments = []

    if (!this.idrFound) {
      // NOTE: previously, frames were skipped completely if they arrived before
      // an IDR was present, but that might interfere with proper timing information
      // regarding the start of the presentation, so just print a warning.
      console.warn(
        'frame preceeds first IDR frame indicating incomplete start of stream'
      )
    }

    return new H264Message({
      data: frame,
      idrPicture: nalType === NAL_TYPES.IDR_PICTURE,
      nalType,
      ntpTimestamp: rtp.ntpTimestamp,
      payloadType: rtp.payloadType,
      timestamp: rtp.timestamp,
    })
  }
}
