import {
  readUInt8,
  readUInt16BE,
  readUInt24BE,
  readUInt32BE,
  decode,
} from 'utils/bytes'
import { MessageType, RtcpMessage } from '../../components/message'
import { POS } from '../bits'

// Real Time Control Protocol (RTCP)
// https://tools.ietf.org/html/rfc3550#section-6

/*
Common RTCP packed header:

        0                   1                   2                   3
        0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
header |V=2|P|    RC   |   PT=SR=200   |             length            |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
*/
export enum RTCPPacketType {
  SR = 200,
  RR = 201,
  SDES = 202,
  BYE = 203,
  APP = 204,
}

export interface Rtcp {
  readonly version: number
  readonly padding: boolean
  readonly count: number
  readonly packetType: RTCPPacketType | number
  readonly length: number
}

const parseBase = (buffer: Uint8Array): Rtcp => ({
  version: buffer[0] >>> 6,
  padding: !!(buffer[0] & POS[2]),
  count: buffer[0] & 0x1f,
  packetType: readUInt8(buffer, 1),
  length: readUInt16BE(buffer, 2),
})

export const parseRtcp = (
  buffer: Uint8Array
): Rtcp | RtcpSR | RtcpRR | RtcpSDES | RtcpBye | RtcpApp => {
  const base = parseBase(buffer)

  switch (base.packetType) {
    case RTCPPacketType.SR:
      return parseSR(buffer, base)
    case RTCPPacketType.RR:
      return parseRR(buffer, base)
    case RTCPPacketType.SDES:
      return parseSDES(buffer, base)
    case RTCPPacketType.BYE:
      return parseBYE(buffer, base)
    case RTCPPacketType.APP:
      return parseAPP(buffer, base)
    default:
      return base
  }
}

export const rtcpMessageFromBuffer = (
  channel: number,
  buffer: Uint8Array
): RtcpMessage => {
  return {
    type: MessageType.RTCP,
    // FIXME: update after GenericMessage uses Uint8Array for data
    data: Buffer.from(buffer),
    channel,
    rtcp: parseRtcp(buffer),
  }
}

/*
SR: Sender Report RTCP Packet

        0                   1                   2                   3
        0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
header |V=2|P|    RC   |   PT=SR=200   |             length            |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                         SSRC of sender                        |
       +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
sender |              NTP timestamp, most significant word             |
info   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |             NTP timestamp, least significant word             |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                         RTP timestamp                         |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                     sender's packet count                     |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                      sender's octet count                     |
       +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
report |                 SSRC_1 (SSRC of first source)                 |
block  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  1    | fraction lost |       cumulative number of packets lost       |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |           extended highest sequence number received           |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                      interarrival jitter                      |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                         last SR (LSR)                         |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                   delay since last SR (DLSR)                  |
       +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
report |                 SSRC_2 (SSRC of second source)                |
block  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  2    :                               ...                             :
       +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
       |                  profile-specific extensions                  |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
*/

export const SR = {
  packetType: 200,
}

export interface RtcpReportBlock {
  readonly syncSource: number
  readonly fractionLost: number
  readonly cumulativeNumberOfPacketsLost: number
  readonly extendedHighestSequenceNumberReceived: number
  readonly interarrivalJitter: number
  readonly lastSRTimestamp: number
  readonly delaySinceLastSR: number
}

const parseReportBlocks = (
  count: number,
  buffer: Uint8Array,
  offset: number
): RtcpReportBlock[] => {
  const reports: RtcpReportBlock[] = []
  for (let reportNumber = 0; reportNumber < count; reportNumber++) {
    const o = offset + reportNumber * 24
    reports.push({
      syncSource: readUInt32BE(buffer, o + 0),
      fractionLost: readUInt8(buffer, o + 4),
      cumulativeNumberOfPacketsLost: readUInt24BE(buffer, o + 5),
      extendedHighestSequenceNumberReceived: readUInt32BE(buffer, o + 8),
      interarrivalJitter: readUInt32BE(buffer, o + 12),
      lastSRTimestamp: readUInt32BE(buffer, o + 16),
      delaySinceLastSR: readUInt32BE(buffer, o + 20),
    })
  }
  return reports
}

export interface RtcpSR extends Rtcp {
  readonly version: RTCPPacketType.SR

  readonly syncSource: number
  readonly ntpMost: number
  readonly ntpLeast: number
  readonly rtpTimestamp: number
  readonly sendersPacketCount: number
  readonly sendersOctetCount: number
  readonly reports: readonly RtcpReportBlock[]
}

const parseSR = (buffer: Uint8Array, base: Rtcp): RtcpSR => ({
  ...base,
  syncSource: readUInt32BE(buffer, 4),
  ntpMost: readUInt32BE(buffer, 8),
  ntpLeast: readUInt32BE(buffer, 12),
  rtpTimestamp: readUInt32BE(buffer, 16),
  sendersPacketCount: readUInt32BE(buffer, 20),
  sendersOctetCount: readUInt32BE(buffer, 24),
  reports: parseReportBlocks(base.count, buffer, 28),
})

export const isRtcpSR = (rtcp: Rtcp): rtcp is RtcpSR =>
  rtcp.packetType === RTCPPacketType.SR

/*
RR: Receiver Report RTCP Packet

        0                   1                   2                   3
        0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
header |V=2|P|    RC   |   PT=RR=201   |             length            |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                     SSRC of packet sender                     |
       +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
report |                 SSRC_1 (SSRC of first source)                 |
block  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  1    | fraction lost |       cumulative number of packets lost       |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |           extended highest sequence number received           |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                      interarrival jitter                      |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                         last SR (LSR)                         |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                   delay since last SR (DLSR)                  |
       +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
report |                 SSRC_2 (SSRC of second source)                |
block  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  2    :                               ...                             :
       +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
       |                  profile-specific extensions                  |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
*/

export interface RtcpRR extends Rtcp {
  readonly version: RTCPPacketType.RR

  readonly syncSource: number
  readonly reports: readonly RtcpReportBlock[]
}

const parseRR = (buffer: Uint8Array, base: Rtcp): RtcpRR => ({
  ...base,
  syncSource: readUInt32BE(buffer, 4),
  reports: parseReportBlocks(base.count, buffer, 8),
})

export const isRtcpRR = (rtcp: Rtcp): rtcp is RtcpRR =>
  rtcp.packetType === RTCPPacketType.RR

/*
SDES: Source Description RTCP Packet

        0                   1                   2                   3
        0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
header |V=2|P|    SC   |  PT=SDES=202  |             length            |
       +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
chunk  |                          SSRC/CSRC_1                          |
  1    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                           SDES items                          |
       |                              ...                              |
       +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
chunk  |                          SSRC/CSRC_2                          |
  2    +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
       |                           SDES items                          |
       |                              ...                              |
       +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
*/

export enum SDESItem {
  CNAME = 1,
  NAME = 2,
  EMAIL = 3,
  PHONE = 4,
  LOC = 5,
  TOOL = 6,
  NOTE = 7,
  PRIV = 8,
}

export interface RtcpSDESBlock {
  readonly source: number
  readonly items: Array<[number, string] | [SDESItem.PRIV, string, string]>
}

export interface RtcpSDES extends Rtcp {
  readonly version: RTCPPacketType.SDES

  readonly syncSource: number
  readonly sourceDescriptions: readonly RtcpSDESBlock[]
}

const parseSDES = (buffer: Uint8Array, base: Rtcp): RtcpSDES => {
  const sourceDescriptions: RtcpSDESBlock[] = []
  let offset = 4
  for (let block = 0; block < base.count; block++) {
    const chunk: RtcpSDESBlock = {
      source: readUInt32BE(buffer, offset),
      items: [],
    }
    offset += 4

    while (true) {
      const itemType = readUInt8(buffer, offset++)

      if (itemType === 0) {
        // start next block at word boundary
        if (offset % 4 !== 0) {
          offset += 4 - (offset % 4)
        }
        break
      }

      const length = readUInt8(buffer, offset++)

      if (itemType === SDESItem.PRIV) {
        const prefixLength = readUInt8(buffer, offset)
        const prefix = decode(
          buffer.subarray(offset + 1, offset + 1 + prefixLength)
        )
        const value = decode(
          buffer.subarray(offset + 1 + prefixLength, offset + length)
        )
        chunk.items.push([SDESItem.PRIV, prefix, value])
      } else {
        const value = decode(buffer.subarray(offset, offset + length))
        chunk.items.push([itemType, value])
      }

      offset += length
    }
    sourceDescriptions.push(chunk)
  }

  return {
    ...base,
    syncSource: readUInt32BE(buffer, 4),
    sourceDescriptions,
  }
}

export const isRtcpSDES = (rtcp: Rtcp): rtcp is RtcpSDES =>
  rtcp.packetType === RTCPPacketType.SDES

/*
BYE: Goodbye RTCP Packet

       0                   1                   2                   3
       0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
      |V=2|P|    SC   |   PT=BYE=203  |             length            |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
      |                           SSRC/CSRC                           |
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
      :                              ...                              :
      +=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+
(opt) |     length    |               reason for leaving            ...
      +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
*/

export interface RtcpBye extends Rtcp {
  readonly version: RTCPPacketType.BYE

  readonly sources: number[]
  readonly reason?: string
}

const parseBYE = (buffer: Uint8Array, base: Rtcp): RtcpBye => {
  const sources: number[] = []
  for (let block = 0; block < base.count; block++) {
    sources.push(readUInt32BE(buffer, 4 + 4 * block))
  }

  let reason
  if (base.length > base.count) {
    const start = 4 + 4 * base.count
    const length = readUInt8(buffer, start)
    reason = decode(buffer.subarray(start + 1, start + 1 + length))
  }

  return {
    ...base,
    sources,
    reason,
  }
}

export const isRtcpBye = (rtcp: Rtcp): rtcp is RtcpBye =>
  rtcp.packetType === RTCPPacketType.BYE

/*
APP: Application-Defined RTCP Packet

    0                   1                   2                   3
    0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |V=2|P| subtype |   PT=APP=204  |             length            |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |                           SSRC/CSRC                           |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |                          name (ASCII)                         |
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
   |                   application-dependent data                ...
   +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

*/

export interface RtcpApp extends Rtcp {
  readonly version: RTCPPacketType.APP

  readonly subtype: number
  readonly source: number
  readonly name: string
  readonly data: Uint8Array
}

const parseAPP = (buffer: Uint8Array, base: Rtcp): RtcpApp => {
  return {
    ...base,
    subtype: base.count,
    source: readUInt32BE(buffer, 4),
    name: decode(buffer.subarray(8, 12)),
    data: buffer.subarray(12),
  }
}

export const isRtcpApp = (rtcp: Rtcp): rtcp is RtcpApp =>
  rtcp.packetType === RTCPPacketType.APP
