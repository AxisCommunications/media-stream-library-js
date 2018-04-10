const { Rtp } = require('../../utils/protocols')
const {
  makeImageHeader,
  makeQuantHeader,
  makeFrameHeader,
  makeHuffmanHeader,
  makeScanHeader
} = require('./headers')

/**  Each packet contains a special JPEG header which immediately follows
   the RTP header.  The first 8 bytes of this header, called the "main
   JPEG header", are as follows:

    0                   1                   2                   3
    0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   | Type-specific |              Fragment Offset                  |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |      Type     |       Q       |     Width     |     Height    |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

 */

/** Restart Marker header: when using types 64-127
    0                   1                   2                   3
    0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |       Restart Interval        |F|L|       Restart Count       |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 */

/** Quantization Table header: when using Q values 128-255
    0                   1                   2                   3
    0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |      MBZ      |   Precision   |             Length            |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |                    Quantization Table Data                    |
   |                              ...                              |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
 */

module.exports = function jpegDepayFactory (width, height) {
  const IMAGE_HEADER = makeImageHeader()
  const HUFFMAN_HEADER = makeHuffmanHeader()
  const SCAN_HEADER = makeScanHeader()

  return function jpegDepay (packets) {
    let metadata
    const fragments = packets.map((packet) => {
      let payload = Rtp.payload(packet)

      // Parse and extract JPEG header.
      const typeSpecific = payload.readUInt8(0)
      const fragmentOffset = payload.readUInt8(1) << 16 | payload.readUInt8(2) << 8 | payload.readUInt8(3)
      const type = payload.readUInt8(4)
      const Q = payload.readUInt8(5)
      // const width = payload.readUInt8(6) * 8
      // const height = payload.readUInt8(7) * 8
      payload = payload.slice(8)

      // Parse and extract Restart Marker header if present.
      let DRI = 0
      if (type >= 64 && type <= 127) {
        DRI = payload.readUInt16BE(0)
        payload = payload.slice(4)
      }

      // Parse and extract Quantization Table header if present.
      if (Q >= 128 && fragmentOffset === 0) {
        // const MBZ = payload.readUInt8()
        const precision = payload.readUInt8(1)
        const length = payload.readUInt16BE(2)
        const qTable = payload.slice(4, 4 + length)
        metadata = {
          typeSpecific, type, width, height, DRI, precision, qTable
        }
        payload = payload.slice(4 + length)
      }

      return payload
    })

    const { precision, qTable, type } = metadata

    const quantHeader = makeQuantHeader(precision, qTable)

    if (metadata.DRI !== 0) {
      // makeDRIHeader
    }

    const frameHeader = makeFrameHeader(width, height, type)

    return Buffer.concat([
      IMAGE_HEADER,
      quantHeader,
      frameHeader,
      HUFFMAN_HEADER,
      SCAN_HEADER,
      ...fragments
    ])
  }
}
