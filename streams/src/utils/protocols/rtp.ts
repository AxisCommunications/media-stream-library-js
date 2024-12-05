import { readUInt16BE, readUInt32BE } from 'utils/bytes'
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

export const version = (bytes: Uint8Array): number => {
  return bytes[0] >>> 6
}

export const padding = (bytes: Uint8Array): boolean => {
  return !!(bytes[0] & POS[2])
}

export const extension = (bytes: Uint8Array): boolean => {
  return !!(bytes[0] & POS[3])
}

export const cSrcCount = (bytes: Uint8Array): number => {
  return bytes[0] & 0x0f
}

export const marker = (bytes: Uint8Array): boolean => {
  return !!(bytes[1] & POS[0])
}

export const payloadType = (bytes: Uint8Array): number => {
  return bytes[1] & 0x7f
}

export const sequenceNumber = (bytes: Uint8Array): number => {
  return readUInt16BE(bytes, 2)
}

export const timestamp = (bytes: Uint8Array): number => {
  return readUInt32BE(bytes, 4)
}

export const sSrc = (bytes: Uint8Array): number => {
  return readUInt32BE(bytes, 8)
}

export const cSrc = (bytes: Uint8Array, rank = 0): number => {
  return cSrcCount(bytes) > rank ? readUInt32BE(bytes, 12 + rank * 4) : 0
}

export const extHeaderLength = (bytes: Uint8Array): number => {
  return !extension(bytes)
    ? 0
    : readUInt16BE(bytes, 12 + cSrcCount(bytes) * 4 + 2)
}

export const extHeader = (bytes: Uint8Array): Uint8Array => {
  return extHeaderLength(bytes) === 0
    ? new Uint8Array(0)
    : bytes.subarray(
        12 + cSrcCount(bytes) * 4,
        12 + cSrcCount(bytes) * 4 + 4 + extHeaderLength(bytes) * 4
      )
}

export const payload = (bytes: Uint8Array): Uint8Array => {
  return !extension(bytes)
    ? bytes.subarray(12 + cSrcCount(bytes) * 4)
    : bytes.subarray(12 + cSrcCount(bytes) * 4 + 4 + extHeaderLength(bytes) * 4)
}
