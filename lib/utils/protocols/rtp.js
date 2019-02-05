const { POS } = require('../bits')

// Real Time Protocol (RTP)
// https://tools.ietf.org/html/rfc3550#section-5.1

/*
RTP Fixed Header Fields

  0               1               2               3
  0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7 0 1 2 3 4 5 6 7
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |V=2|P|X|  CC   |M|     PT      |       sequence number         |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                           timestamp                           |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |           synchronization source (SSRC) identifier            |
  +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
  |            contributing source (CSRC) identifiers             |
  |                             ....                              |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |   profile-specific ext. id    | profile-specific ext. length  |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                 profile-specific extension                    |
  |                             ....                              |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
*/

const version = (buffer) => {
  return buffer[0] >>> 6
}

const padding = (buffer) => {
  return !!((buffer[0] & POS[2]))
}

const extension = (buffer) => {
  return !!((buffer[0] & POS[3]))
}

const cSrcCount = (buffer) => {
  return buffer[0] & 0x0f
}

const marker = (buffer) => {
  return !!((buffer[1] & POS[0]))
}

const payloadType = (buffer) => {
  return buffer[1] & 0x7f
}

const sequenceNumber = (buffer) => {
  return buffer.readUInt16BE(2)
}

const timestamp = (buffer) => {
  return buffer.readUInt32BE(4)
}

const sSrc = (buffer) => {
  return buffer.readUInt32BE(8)
}

const cSrc = (buffer, rank = 0) => {
  return cSrcCount(buffer) > rank
    ? buffer.readUInt32BE(12 + rank * 4)
    : 0
}

const extHeaderLength = (buffer) => {
  return extension(buffer) === false
    ? 0
    : buffer.readUInt16BE(12 + cSrcCount(buffer) * 4 + 2)
}

const extHeader = (buffer) => {
  return extHeaderLength(buffer) === 0
    ? Buffer.from([])
    : buffer.slice(12 + cSrcCount(buffer) * 4, 12 + cSrcCount(buffer) * 4 + 4 + extHeaderLength(buffer) * 4)
}

const payload = (buffer) => {
  return extension(buffer) === false
    ? buffer.slice(12 + cSrcCount(buffer) * 4)
    : buffer.slice(12 + cSrcCount(buffer) * 4 + 4 + extHeaderLength(buffer) * 4)
}

module.exports = {
  version,
  padding,
  extension,
  cSrcCount,
  marker,
  payloadType,
  sequenceNumber,
  timestamp,
  sSrc,
  cSrc,
  extHeader,
  payload
}
