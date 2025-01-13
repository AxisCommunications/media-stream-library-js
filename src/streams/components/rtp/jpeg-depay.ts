import { JpegMessage } from '../types/jpeg'
import { RtpMessage } from '../types/rtp'
import { MediaDescription, isJpegMedia } from '../types/sdp'

import { concat, readUInt8, readUInt16BE } from '../utils/bytes'

import {
  makeDRIHeader,
  makeFrameHeader,
  makeHuffmanHeader,
  makeImageHeader,
  makeQuantHeader,
  makeScanHeader,
} from './jpeg-headers'
import { makeQtable } from './jpeg-qtable'

/**
 * Each packet contains a special JPEG header which immediately follows
 * the RTP header.  The first 8 bytes of this header, called the "main
 * JPEG header", are as follows:*
 *  0                   1                   2                   3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * | Type-specific |              Fragment Offset                  |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |      Type     |       Q       |     Width     |     Height    |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 */

/**
 * Restart Marker header: when using types 64-127
 *  0                   1                   2                   3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |       Restart Interval        |F|L|       Restart Count       |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 */

/**
 * Quantization Table header: when using Q values 128-255
 *  0                   1                   2                   3
 *  0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |      MBZ      |   Precision   |             Length            |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 * |                    Quantization Table Data                    |
 * |                              ...                              |
 * +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 */

export class JPEGDepay {
  public payloadType?: number

  private width = 0
  private height = 0
  private headers = {
    image: makeImageHeader(),
    huffman: makeHuffmanHeader(),
    scan: makeScanHeader(),
  }
  private payloads: Uint8Array[] = []

  constructor(media: MediaDescription[]) {
    const jpegMedia = media.find(isJpegMedia)

    if (!jpegMedia) {
      return
    }

    const framesize = jpegMedia?.framesize ?? [0, 0]
    this.width = framesize[0]
    this.height = framesize[1]

    this.payloadType = jpegMedia.rtpmap?.payloadType
  }

  parse(rtp: RtpMessage): JpegMessage | undefined {
    this.payloads.push(rtp.data)

    // JPEG over RTP uses the RTP marker bit to indicate end
    // of fragmentation. At this point, the packets can be used
    // to reconstruct a JPEG frame.
    if (!rtp.marker) {
      return
    }

    let metadata
    const fragments: Uint8Array[] = []
    for (const payload of this.payloads) {
      let fragment = payload

      // Parse and extract JPEG header.
      const typeSpecific = readUInt8(fragment, 0)
      const fragmentOffset =
        (readUInt8(fragment, 1) << 16) |
        (readUInt8(fragment, 2) << 8) |
        readUInt8(fragment, 3)
      const type = readUInt8(fragment, 4)
      const Q = readUInt8(fragment, 5)
      const width = readUInt8(fragment, 6) * 8 || this.width
      const height = readUInt8(fragment, 7) * 8 || this.height
      fragment = fragment.subarray(8)

      // Parse and extract Restart Marker header if present.
      let DRI = 0
      if (type >= 64 && type <= 127) {
        DRI = readUInt16BE(fragment, 0)
        fragment = fragment.subarray(4)
      }

      // Parse and extract Quantization Table header if present.
      if (Q >= 128 && fragmentOffset === 0) {
        // const MBZ = fragment.readUInt8()
        const precision = readUInt8(fragment, 1)
        const length = readUInt16BE(fragment, 2)
        const qTable = fragment.subarray(4, 4 + length)
        metadata = {
          typeSpecific,
          type,
          width,
          height,
          DRI,
          precision,
          qTable,
        }
        fragment = fragment.subarray(4 + length)
      } // Compute Quantization Table
      else if (Q < 128 && fragmentOffset === 0) {
        const precision = 0
        const qTable = makeQtable(Q)
        metadata = {
          typeSpecific,
          type,
          width,
          height,
          DRI,
          precision,
          qTable,
        }
      }

      fragments.push(fragment)
    }

    if (metadata === undefined) {
      throw new Error('no quantization header present')
    }

    const { precision, qTable, type, width, height } = metadata

    const quantHeader = makeQuantHeader(precision, qTable)

    const driHeader =
      metadata.DRI === 0 ? new Uint8Array(0) : makeDRIHeader(metadata.DRI)

    const frameHeader = makeFrameHeader(width, height, type)

    this.payloads = []

    return new JpegMessage({
      timestamp: rtp.timestamp,
      ntpTimestamp: rtp.ntpTimestamp,
      payloadType: rtp.payloadType,
      framesize: { width, height },
      data: concat([
        this.headers.image,
        quantHeader,
        driHeader,
        frameHeader,
        this.headers.huffman,
        this.headers.scan,
        ...fragments,
      ]),
    })
  }
}
