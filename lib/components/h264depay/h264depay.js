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
const { Rtp } = require('../../utils/protocols')
const { ELEMENTARY } = require('../messageTypes')
const debug = require('debug')('msl:h264depay')

module.exports = function extract (buffered, rtp, callback) {
  const payload = Rtp.payload(rtp.data)
  const type = (payload[0] & 0x1f)

  if (type === 28)/* FU-A NALU */ {
    const fuIndicator = payload[0]
    const fuHeader = payload[1]
    const startBit = !!(fuHeader >> 7)
    const nalType = fuHeader & 0x1f
    const nal = fuIndicator & 0xe0 | nalType
    const stopBit = fuHeader & 64
    if (startBit) {
      return Buffer.concat([Buffer.from([0, 0, 0, 0, nal]), payload.slice(2)])
    } else if (stopBit)/* receieved end bit */ {
      const h264frame = Buffer.concat([buffered, payload.slice(2)])
      h264frame.writeUInt32BE(h264frame.length - 4, 0, true)
      const msg = {
        data: h264frame,
        type: ELEMENTARY,
        timestamp: Rtp.timestamp(rtp.data),
        ntpTimestamp: rtp.ntpTimestamp,
        payloadType: Rtp.payloadType(rtp.data)
      }
      callback(msg)
      return Buffer.alloc(0)
    } else {
      // Put the received data on the buffer and cut the header bytes
      return Buffer.concat([buffered, payload.slice(2)])
    }
  } else if ((type === 1 || type === 5) && buffered.length === 0) /* Single NALU */ {
    const h264frame = Buffer.concat([Buffer.from([0, 0, 0, 0]), payload])
    h264frame.writeUInt32BE(h264frame.length - 4, 0, true)
    const msg = {
      data: h264frame,
      type: ELEMENTARY,
      timestamp: Rtp.timestamp(rtp.data),
      ntpTimestamp: rtp.ntpTimestamp,
      payloadType: Rtp.payloadType(rtp.data)
    }
    callback(msg)
    return Buffer.alloc(0)
  } else {
    debug(`H264depayComponent can only extract types 1,5 and 28, got ${type}`)
    return Buffer.alloc(0)
  }
}
