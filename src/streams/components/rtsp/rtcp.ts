// Real Time Control Protocol (RTCP) - parsers
// https://tools.ietf.org/html/rfc3550#section-6

import {
  RTCPPacketType,
  Rtcp,
  RtcpApp,
  RtcpBye,
  RtcpRR,
  RtcpReportBlock,
  RtcpSDES,
  RtcpSDESBlock,
  RtcpSR,
  SDESItem,
} from '../types/rtcp'

import { POS } from '../utils/bits'
import {
  decode,
  readUInt8,
  readUInt16BE,
  readUInt24BE,
  readUInt32BE,
} from '../utils/bytes'

/*
Common RTCP packed header:

        0                   1                   2                   3
        0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
header |V=2|P|    RC   |   PT=SR=200   |             length            |
       +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
*/

const parseHeader = (buffer: Uint8Array): Rtcp => ({
  version: buffer[0] >>> 6,
  padding: !!(buffer[0] & POS[2]),
  count: buffer[0] & 0x1f,
  packetType: readUInt8(buffer, 1),
  length: readUInt16BE(buffer, 2),
})

export const parseRtcp = (
  bytes: Uint8Array
): Rtcp | RtcpSR | RtcpRR | RtcpSDES | RtcpBye | RtcpApp => {
  const base = parseHeader(bytes)

  switch (base.packetType) {
    case RTCPPacketType.SR:
      return parseSR(bytes, base)
    case RTCPPacketType.RR:
      return parseRR(bytes, base)
    case RTCPPacketType.SDES:
      return parseSDES(bytes, base)
    case RTCPPacketType.BYE:
      return parseBYE(bytes, base)
    case RTCPPacketType.APP:
      return parseAPP(bytes, base)
    default:
      return base
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

const parseReportBlocks = (
  count: number,
  bytes: Uint8Array,
  offset: number
): RtcpReportBlock[] => {
  const reports: RtcpReportBlock[] = []
  for (let reportNumber = 0; reportNumber < count; reportNumber++) {
    const o = offset + reportNumber * 24
    reports.push({
      syncSource: readUInt32BE(bytes, o + 0),
      fractionLost: readUInt8(bytes, o + 4),
      cumulativeNumberOfPacketsLost: readUInt24BE(bytes, o + 5),
      extendedHighestSequenceNumberReceived: readUInt32BE(bytes, o + 8),
      interarrivalJitter: readUInt32BE(bytes, o + 12),
      lastSRTimestamp: readUInt32BE(bytes, o + 16),
      delaySinceLastSR: readUInt32BE(bytes, o + 20),
    })
  }
  return reports
}

const parseSR = (bytes: Uint8Array, base: Rtcp): RtcpSR => ({
  ...base,
  syncSource: readUInt32BE(bytes, 4),
  ntpMost: readUInt32BE(bytes, 8),
  ntpLeast: readUInt32BE(bytes, 12),
  rtpTimestamp: readUInt32BE(bytes, 16),
  sendersPacketCount: readUInt32BE(bytes, 20),
  sendersOctetCount: readUInt32BE(bytes, 24),
  reports: parseReportBlocks(base.count, bytes, 28),
})

const parseRR = (bytes: Uint8Array, base: Rtcp): RtcpRR => ({
  ...base,
  syncSource: readUInt32BE(bytes, 4),
  reports: parseReportBlocks(base.count, bytes, 8),
})

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

const parseSDES = (bytes: Uint8Array, base: Rtcp): RtcpSDES => {
  const sourceDescriptions: RtcpSDESBlock[] = []
  let offset = 4
  for (let block = 0; block < base.count; block++) {
    const chunk: RtcpSDESBlock = {
      source: readUInt32BE(bytes, offset),
      items: [],
    }
    offset += 4

    while (true) {
      const itemType = readUInt8(bytes, offset++)

      if (itemType === 0) {
        // start next block at word boundary
        if (offset % 4 !== 0) {
          offset += 4 - (offset % 4)
        }
        break
      }

      const length = readUInt8(bytes, offset++)

      if (itemType === SDESItem.PRIV) {
        const prefixLength = readUInt8(bytes, offset)
        const prefix = decode(
          bytes.subarray(offset + 1, offset + 1 + prefixLength)
        )
        const value = decode(
          bytes.subarray(offset + 1 + prefixLength, offset + length)
        )
        chunk.items.push([SDESItem.PRIV, prefix, value])
      } else {
        const value = decode(bytes.subarray(offset, offset + length))
        chunk.items.push([itemType, value])
      }

      offset += length
    }
    sourceDescriptions.push(chunk)
  }

  return {
    ...base,
    syncSource: readUInt32BE(bytes, 4),
    sourceDescriptions,
  }
}

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

const parseBYE = (bytes: Uint8Array, base: Rtcp): RtcpBye => {
  const sources: number[] = []
  for (let block = 0; block < base.count; block++) {
    sources.push(readUInt32BE(bytes, 4 + 4 * block))
  }

  let reason
  if (base.length > base.count) {
    const start = 4 + 4 * base.count
    const length = readUInt8(bytes, start)
    reason = decode(bytes.subarray(start + 1, start + 1 + length))
  }

  return {
    ...base,
    sources,
    reason,
  }
}

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

const parseAPP = (bytes: Uint8Array, base: Rtcp): RtcpApp => {
  return {
    ...base,
    subtype: base.count,
    source: readUInt32BE(bytes, 4),
    name: decode(bytes.subarray(8, 12)),
    data: bytes.subarray(12),
  }
}
