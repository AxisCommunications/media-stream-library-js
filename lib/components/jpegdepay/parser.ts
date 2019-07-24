import {
  makeImageHeader,
  makeHuffmanHeader,
  makeScanHeader,
  makeQuantHeader,
  makeFrameHeader,
} from './headers'
import { payload } from '../../utils/protocols/rtp'
import { makeQtable } from './make-qtable'

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

export function jpegDepayFactory(defaultWidth = 0, defaultHeight = 0) {
  const IMAGE_HEADER = makeImageHeader()
  const HUFFMAN_HEADER = makeHuffmanHeader()
  const SCAN_HEADER = makeScanHeader()

  return function jpegDepay(packets: Buffer[]) {
    let metadata
    const fragments: Buffer[] = []
    for (const packet of packets) {
      let fragment = payload(packet)

      // Parse and extract JPEG header.
      const typeSpecific = fragment.readUInt8(0)
      const fragmentOffset =
        (fragment.readUInt8(1) << 16) |
        (fragment.readUInt8(2) << 8) |
        fragment.readUInt8(3)
      const type = fragment.readUInt8(4)
      const Q = fragment.readUInt8(5)
      const width = fragment.readUInt8(6) * 8 || defaultWidth
      const height = fragment.readUInt8(7) * 8 || defaultHeight
      fragment = fragment.slice(8)

      // Parse and extract Restart Marker header if present.
      let DRI = 0
      if (type >= 64 && type <= 127) {
        DRI = fragment.readUInt16BE(0)
        fragment = fragment.slice(4)
      }

      // Parse and extract Quantization Table header if present.
      if (Q >= 128 && fragmentOffset === 0) {
        // const MBZ = fragment.readUInt8()
        const precision = fragment.readUInt8(1)
        const length = fragment.readUInt16BE(2)
        const qTable = fragment.slice(4, 4 + length)
        metadata = {
          typeSpecific,
          type,
          width,
          height,
          DRI,
          precision,
          qTable,
        }
        fragment = fragment.slice(4 + length)
      }
      // Compute Quantization Table
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

    if (metadata.DRI !== 0) {
      throw new Error('not implemented: DRI')
    }

    const frameHeader = makeFrameHeader(width, height, type)

    return {
      size: { width, height },
      data: Buffer.concat([
        IMAGE_HEADER,
        quantHeader,
        frameHeader,
        HUFFMAN_HEADER,
        SCAN_HEADER,
        ...fragments,
      ]),
    }
  }
}
