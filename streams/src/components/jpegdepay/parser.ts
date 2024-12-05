import { readUInt8, readUInt16BE } from 'utils/bytes'
import { payload } from '../../utils/protocols/rtp'

import {
  makeDRIHeader,
  makeFrameHeader,
  makeHuffmanHeader,
  makeImageHeader,
  makeQuantHeader,
  makeScanHeader,
} from './headers'
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
    const fragments: Uint8Array[] = []
    for (const packet of packets) {
      let fragment = payload(packet)

      // Parse and extract JPEG header.
      const typeSpecific = readUInt8(fragment, 0)
      const fragmentOffset =
        (readUInt8(fragment, 1) << 16) |
        (readUInt8(fragment, 2) << 8) |
        readUInt8(fragment, 3)
      const type = readUInt8(fragment, 4)
      const Q = readUInt8(fragment, 5)
      const width = readUInt8(fragment, 6) * 8 || defaultWidth
      const height = readUInt8(fragment, 7) * 8 || defaultHeight
      fragment = fragment.slice(8)

      // Parse and extract Restart Marker header if present.
      let DRI = 0
      if (type >= 64 && type <= 127) {
        DRI = readUInt16BE(fragment, 0)
        fragment = fragment.slice(4)
      }

      // Parse and extract Quantization Table header if present.
      if (Q >= 128 && fragmentOffset === 0) {
        // const MBZ = fragment.readUInt8()
        const precision = readUInt8(fragment, 1)
        const length = readUInt16BE(fragment, 2)
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
      metadata.DRI === 0 ? Buffer.alloc(0) : makeDRIHeader(metadata.DRI)

    const frameHeader = makeFrameHeader(width, height, type)

    return {
      size: { width, height },
      data: Buffer.concat([
        IMAGE_HEADER,
        quantHeader,
        driHeader,
        frameHeader,
        HUFFMAN_HEADER,
        SCAN_HEADER,
        ...fragments,
      ]),
    }
  }
}
