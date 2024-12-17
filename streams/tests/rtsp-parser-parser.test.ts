import * as assert from 'uvu/assert'

import { MessageType, SdpMessage } from 'components/message'
import { Parser } from 'components/rtsp-parser/parser'
import { concat, decode, encode } from 'utils/bytes'

import {
  frames,
  rtspRtpRtcpCombined,
  rtspWithTrailingRtp,
  sdpResponse,
  setupResponse,
} from './rtsp-parser.fixtures'
import { describe } from './uvu-describe'

describe('parsing of interleaved data', (test) => {
  test('can append buffers', () => {
    const parser = new Parser()
    const a = parser.parse(new Uint8Array(0))
    assert.equal(a, [])
  })

  test('should handle a [36, 0, x] buffer correctly', () => {
    const parser = new Parser()
    const messages = parser.parse(new Uint8Array([36, 0, 5]))
    assert.is(messages.length, 0)

    assert.is((parser as any)._length, 3)
  })

  test('should handle a [36] buffer correctly', () => {
    const parser = new Parser()
    const messages = parser.parse(new Uint8Array([36]))
    assert.is(messages.length, 0)

    assert.is((parser as any)._length, 1)
  })

  test('should throw an error when coming across an unknown buffer', () => {
    const parser = new Parser()
    assert.throws(() => parser.parse(new Uint8Array([1, 2, 3])))
  })
})

describe('1 buffer = 1 rtp package', (test) => {
  let buffer1: Uint8Array
  test.before(() => {
    buffer1 = new Uint8Array(frames.onePointZero.length)
    frames.onePointZero.forEach((byte, index) => {
      buffer1[index] = byte
    })
  })

  test('extracts one message', () => {
    const parser = new Parser()
    const messages = parser.parse(buffer1)
    assert.is(messages.length, 1)
  })

  test('extracts message with correct data', () => {
    const parser = new Parser()
    const messages = parser.parse(buffer1)
    const msg = messages[0]
    assert.equal(concat([msg.data]), buffer1.slice(4))

    assert.is((msg as any).channel, 0)
  })

  test('the buffer should be empty afterwards (no messages data buffered)', () => {
    const parser = new Parser()
    parser.parse(buffer1)

    assert.is((parser as any)._length, 0)
  })
})

describe('1 buffer = 1,5 rtp package', (test) => {
  let buffer15: Uint8Array
  test.before(() => {
    buffer15 = new Uint8Array(frames.onePointFive.length)
    frames.onePointFive.forEach((byte, index) => {
      buffer15[index] = byte
    })
  })

  test('extracts one message', () => {
    const parser = new Parser()
    const messages = parser.parse(buffer15)
    assert.is(messages.length, 1)
  })

  test('extracts the full rtp frame', () => {
    const parser = new Parser()
    const messages = parser.parse(buffer15)
    const msg = messages[0]
    const emittedBuffer = msg.data
    assert.is(msg.type, MessageType.RTP)
    assert.equal(
      concat([emittedBuffer]),
      buffer15.slice(4, 4 + emittedBuffer.length)
    )
  })

  test('the buffer should not be empty afterwards (half a frame messages)', () => {
    const parser = new Parser()
    const messages = parser.parse(buffer15)
    const emittedBuffer = messages[0].data
    assert.equal(
      // @ts-ignore we want to check a private field
      parser._chunks[0],
      buffer15.slice(4 + emittedBuffer.length)
    )
  })
})

describe('2 buffers = 1,5 +0,5 rtp package', (test) => {
  let buffer15: Uint8Array
  let buffer05: Uint8Array
  test.before(() => {
    buffer15 = new Uint8Array(frames.onePointFive.length)
    frames.onePointFive.forEach((byte, index) => {
      buffer15[index] = byte
    })
    buffer05 = new Uint8Array(frames.zeroPointFive.length)
    frames.zeroPointFive.forEach((byte, index) => {
      buffer05[index] = byte
    })
  })

  test('extracts two messages', () => {
    const parser = new Parser()
    let messages = parser.parse(buffer15)
    assert.is(messages.length, 1)

    assert.ok((parser as any)._length > 0)
    messages = parser.parse(buffer05)
    assert.is(messages.length, 1)
  })

  test('the buffer should be empty afterwards', () => {
    const parser = new Parser()
    parser.parse(buffer15)
    parser.parse(buffer05)

    assert.is((parser as any)._length, 0)
  })
})

describe('RTSP package', (test) => {
  let RtspBuffer: Uint8Array
  test.before(() => {
    RtspBuffer = new Uint8Array(setupResponse.length)
    setupResponse.split('').forEach((character, index) => {
      RtspBuffer[index] = character.charCodeAt(0)
    })
  })

  test('extracts the RTSP buffer', () => {
    const parser = new Parser()
    const messages = parser.parse(RtspBuffer)
    assert.is(messages.length, 1)
    const msg = messages[0]
    assert.is(msg.type, MessageType.RTSP)
    assert.equal(msg.data, encode(setupResponse))
  })

  test('the buffer should be empty afterwards (no messages data buffered)', () => {
    const parser = new Parser()
    parser.parse(RtspBuffer)

    assert.is((parser as any)._length, 0)
  })

  test('should detect RTP data in same buffer as RTSP', () => {
    const parser = new Parser()
    parser.parse(rtspWithTrailingRtp)

    assert.is((parser as any)._length, 4)
  })

  test('should find RTSP, RTP and RTCP packages in the same buffer', () => {
    const parser = new Parser()
    const messages: Array<any> = parser.parse(rtspRtpRtcpCombined)
    assert.is(messages.length, 4)
    assert.is(messages[0].type, MessageType.RTSP)
    assert.is(messages[1].type, MessageType.RTP)
    assert.is(messages[1].channel, 0)
    assert.is(messages[2].type, MessageType.RTCP)
    assert.is(messages[2].channel, 1)
    assert.is(messages[3].type, MessageType.RTCP)
    assert.is(messages[3].channel, 1)
  })
})

describe('SDP data', (test) => {
  let sdpBuffer: Uint8Array
  test.before(() => {
    sdpBuffer = encode(sdpResponse)
  })

  test('should extract twice, once with the full RTSP and once with the SDP data', () => {
    const parser = new Parser()
    const messages = parser.parse(sdpBuffer)
    assert.is(messages.length, 2)
    assert.is(messages[0].type, MessageType.RTSP)
    assert.is(messages[1].type, MessageType.SDP)
    assert.equal(messages[0].data, sdpBuffer)
    assert.equal(messages[1].data.byteLength, 0)

    const sdp = (messages[1] as SdpMessage).sdp
    assert.is(typeof sdp, 'object')
    assert.is(typeof sdp.session, 'object')
    assert.ok(Array.isArray(sdp.media))
    assert.is(sdp.media[0].type, 'video')
  })

  test('should handle segmented RTSP/SDP', () => {
    const parser = new Parser()
    const segmentedRTSP = sdpResponse.split(/(?<=\r\n\r\n)/g)
    const RTSPBuffer: Uint8Array = encode(segmentedRTSP[0])
    const SDPBuffer: Uint8Array = encode(segmentedRTSP[1])
    let messages = parser.parse(RTSPBuffer)
    assert.is(messages.length, 0)
    messages = parser.parse(SDPBuffer)
    assert.is(messages.length, 2)
  })
})
