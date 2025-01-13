import { POS } from '../utils/bits'
import { readUInt16BE, readUInt32BE } from '../utils/bytes'

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

export interface Rtp {
  readonly version: number
  readonly marker: boolean
  readonly data: Uint8Array
  readonly payloadType: number
  readonly timestamp: number
}

export function parseRtp(packet: Uint8Array): Rtp {
  return {
    data: payload(packet),
    marker: marker(packet),
    payloadType: payloadType(packet),
    timestamp: timestamp(packet),
    version: version(packet),
  }
}

export const version = (packet: Uint8Array): number => {
  return packet[0] >>> 6
}

export const padding = (packet: Uint8Array): boolean => {
  return !!(packet[0] & POS[2])
}

export const extension = (packet: Uint8Array): boolean => {
  return !!(packet[0] & POS[3])
}

export const cSrcCount = (packet: Uint8Array): number => {
  return packet[0] & 0x0f
}

export const marker = (packet: Uint8Array): boolean => {
  return !!(packet[1] & POS[0])
}

export const payloadType = (packet: Uint8Array): number => {
  return packet[1] & 0x7f
}

export const sequenceNumber = (packet: Uint8Array): number => {
  return readUInt16BE(packet, 2)
}

export const timestamp = (packet: Uint8Array): number => {
  return readUInt32BE(packet, 4)
}

export const sSrc = (packet: Uint8Array): number => {
  return readUInt32BE(packet, 8)
}

export const cSrc = (packet: Uint8Array, rank = 0): number => {
  return cSrcCount(packet) > rank ? readUInt32BE(packet, 12 + rank * 4) : 0
}

export const extHeaderLength = (packet: Uint8Array): number => {
  return !extension(packet)
    ? 0
    : readUInt16BE(packet, 12 + cSrcCount(packet) * 4 + 2)
}

export const extHeader = (packet: Uint8Array): Uint8Array => {
  return extHeaderLength(packet) === 0
    ? new Uint8Array(0)
    : packet.subarray(
        12 + cSrcCount(packet) * 4,
        12 + cSrcCount(packet) * 4 + 4 + extHeaderLength(packet) * 4
      )
}

export const payload = (packet: Uint8Array): Uint8Array => {
  return !extension(packet)
    ? packet.subarray(12 + cSrcCount(packet) * 4)
    : packet.subarray(
        12 + cSrcCount(packet) * 4 + 4 + extHeaderLength(packet) * 4
      )
}
