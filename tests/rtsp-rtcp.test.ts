import * as assert from 'uvu/assert'
import { describe } from './uvu-describe'

import {
  rtcpAPPBuffers,
  rtcpBYEBuffers,
  rtcpRRBuffers,
  rtcpSDESBuffers,
  rtcpSRBuffers,
} from './rtsp-rtcp.fixtures'

import { parseRtcp } from '../src/streams/components/rtsp/rtcp'

describe('Rtcp parsing', (test) => {
  test('parsed SR correctly', () => {
    assert.equal(parseRtcp(rtcpSRBuffers[0]), {
      version: 2,
      padding: false,
      count: 0,
      packetType: 200,
      length: 6,

      syncSource: 4090175489,
      ntpMost: 2209022881,
      ntpLeast: 3942779706,
      rtpTimestamp: 37920,
      sendersPacketCount: 158,
      sendersOctetCount: 39816,
      reports: [],
    })

    assert.equal(parseRtcp(rtcpSRBuffers[1]), {
      version: 2,
      padding: false,
      count: 3,
      packetType: 200,
      length: 24,

      syncSource: 4090175489,
      ntpMost: 2209022881,
      ntpLeast: 3942779706,
      rtpTimestamp: 37920,
      sendersPacketCount: 158,
      sendersOctetCount: 39816,
      reports: [
        {
          syncSource: 1,
          fractionLost: 4,
          cumulativeNumberOfPacketsLost: 10,
          extendedHighestSequenceNumberReceived: 232,
          interarrivalJitter: 5,
          lastSRTimestamp: 6,
          delaySinceLastSR: 7,
        },
        {
          syncSource: 2,
          fractionLost: 4,
          cumulativeNumberOfPacketsLost: 11,
          extendedHighestSequenceNumberReceived: 233,
          interarrivalJitter: 8,
          lastSRTimestamp: 9,
          delaySinceLastSR: 10,
        },
        {
          syncSource: 3,
          fractionLost: 4,
          cumulativeNumberOfPacketsLost: 12,
          extendedHighestSequenceNumberReceived: 234,
          interarrivalJitter: 11,
          lastSRTimestamp: 12,
          delaySinceLastSR: 13,
        },
      ],
    })
  })

  test('parsed RR correctly', () => {
    assert.equal(parseRtcp(rtcpRRBuffers[0]), {
      version: 2,
      padding: false,
      count: 0,
      packetType: 201,
      length: 1,

      syncSource: 460716364,
      reports: [],
    })

    assert.equal(parseRtcp(rtcpRRBuffers[1]), {
      version: 2,
      padding: false,
      count: 3,
      packetType: 201,
      length: 19,

      syncSource: 460716364,
      reports: [
        {
          syncSource: 1,
          fractionLost: 4,
          cumulativeNumberOfPacketsLost: 10,
          extendedHighestSequenceNumberReceived: 232,
          interarrivalJitter: 5,
          lastSRTimestamp: 6,
          delaySinceLastSR: 7,
        },
        {
          syncSource: 2,
          fractionLost: 4,
          cumulativeNumberOfPacketsLost: 11,
          extendedHighestSequenceNumberReceived: 233,
          interarrivalJitter: 8,
          lastSRTimestamp: 9,
          delaySinceLastSR: 10,
        },
        {
          syncSource: 3,
          fractionLost: 4,
          cumulativeNumberOfPacketsLost: 12,
          extendedHighestSequenceNumberReceived: 234,
          interarrivalJitter: 11,
          lastSRTimestamp: 12,
          delaySinceLastSR: 13,
        },
      ],
    })
  })

  test('parsed SDES correctly', () => {
    assert.equal(parseRtcp(rtcpSDESBuffers[0]), {
      version: 2,
      padding: false,
      count: 1,
      packetType: 202,
      length: 12,

      syncSource: 3650993623,
      sourceDescriptions: [
        {
          source: 3650993623,
          items: [
            [1, 'user2503145766@host-29205952'],
            [6, 'GStreamer'],
          ],
        },
      ],
    })

    assert.equal(parseRtcp(rtcpSDESBuffers[1]), {
      version: 2,
      padding: false,
      count: 2,
      packetType: 202,
      length: 12,

      syncSource: 1,
      sourceDescriptions: [
        {
          source: 1,
          items: [
            [1, 'CNAME1'],
            [8, 'C1', 'V1'],
          ],
        },
        {
          source: 2,
          items: [
            [1, 'CNAME2'],
            [8, 'C2', 'V2'],
            [8, 'C3', 'V3'],
          ],
        },
      ],
    })
  })

  test('parsed BYE correctly', () => {
    assert.equal(parseRtcp(rtcpBYEBuffers[0]), {
      version: 2,
      padding: false,
      count: 1,
      packetType: 203,
      length: 1,

      sources: [650497119],
      reason: undefined,
    })

    assert.equal(parseRtcp(rtcpBYEBuffers[1]), {
      version: 2,
      padding: false,
      count: 0,
      packetType: 203,
      length: 0,

      sources: [],
      reason: undefined,
    })

    assert.equal(parseRtcp(rtcpBYEBuffers[2]), {
      version: 2,
      padding: false,
      count: 3,
      packetType: 203,
      length: 5,

      sources: [1, 2, 3],
      reason: 'Lost',
    })
  })

  test('parsed APP correctly', () => {
    assert.equal(parseRtcp(rtcpAPPBuffers[0]), {
      version: 2,
      padding: false,
      count: 5,
      packetType: 204,
      length: 4,

      subtype: 5,
      source: 42,
      name: 'Life',
      data: new Uint8Array([0, 1, 2, 3, 42, 42, 42, 42]),
    })
  })
})
