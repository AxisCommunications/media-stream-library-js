import { POS } from '../bits'

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

export const version = (buffer: Buffer) => {
  return buffer[0] >>> 6
}

export const padding = (buffer: Buffer) => {
  return !!(buffer[0] & POS[2])
}

export const extension = (buffer: Buffer) => {
  return !!(buffer[0] & POS[3])
}

export const cSrcCount = (buffer: Buffer) => {
  return buffer[0] & 0x0f
}

export const marker = (buffer: Buffer) => {
  return !!(buffer[1] & POS[0])
}

export const payloadType = (buffer: Buffer) => {
  return buffer[1] & 0x7f
}

export const sequenceNumber = (buffer: Buffer) => {
  return buffer.readUInt16BE(2)
}

export const timestamp = (buffer: Buffer) => {
  return buffer.readUInt32BE(4)
}

export const sSrc = (buffer: Buffer) => {
  return buffer.readUInt32BE(8)
}

export const cSrc = (buffer: Buffer, rank = 0) => {
  return cSrcCount(buffer) > rank ? buffer.readUInt32BE(12 + rank * 4) : 0
}

export const extHeaderLength = (buffer: Buffer) => {
  return extension(buffer) === false
    ? 0
    : buffer.readUInt16BE(12 + cSrcCount(buffer) * 4 + 2)
}

export const extHeader = (buffer: Buffer) => {
  return extHeaderLength(buffer) === 0
    ? Buffer.from([])
    : buffer.slice(
        12 + cSrcCount(buffer) * 4,
        12 + cSrcCount(buffer) * 4 + 4 + extHeaderLength(buffer) * 4,
      )
}

export const payload = (buffer: Buffer) => {
  return extension(buffer) === false
    ? buffer.slice(12 + cSrcCount(buffer) * 4)
    : buffer.slice(12 + cSrcCount(buffer) * 4 + 4 + extHeaderLength(buffer) * 4)
}
