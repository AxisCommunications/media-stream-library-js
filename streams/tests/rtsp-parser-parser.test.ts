import * as assert from 'uvu/assert'

import { MessageType } from 'components/message'
import { Parser } from 'components/rtsp-parser/parser'

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
    const a = parser.parse(Buffer.alloc(0))
    assert.equal(a, [])
  })

  test('should handle a [36, 0, x] buffer correctly', () => {
    const parser = new Parser()
    const messages = parser.parse(Buffer.from([36, 0, 5]))
    assert.is(messages.length, 0)

    assert.is((parser as any)._length, 3)
  })

  test('should handle a [36] buffer correctly', () => {
    const parser = new Parser()
    const messages = parser.parse(Buffer.from([36]))
    assert.is(messages.length, 0)

    assert.is((parser as any)._length, 1)
  })

  test('should throw an error when coming across an unknown buffer', () => {
    const parser = new Parser()
    assert.throws(() => parser.parse(Buffer.from([1, 2, 3])))
  })
})

describe('1 buffer = 1 rtp package', (test) => {
  let buffer1: Buffer
  test.before(() => {
    buffer1 = Buffer.alloc(frames.onePointZero.length)
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
    assert.equal(Buffer.concat([msg.data]), buffer1.slice(4))

    assert.is((msg as any).channel, 0)
  })

  test('the buffer should be empty afterwards (no messages data buffered)', () => {
    const parser = new Parser()
    parser.parse(buffer1)

    assert.is((parser as any)._length, 0)
  })
})

describe('1 buffer = 1,5 rtp package', (test) => {
  let buffer15: Buffer
  test.before(() => {
    buffer15 = Buffer.alloc(frames.onePointFive.length)
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
      Buffer.concat([emittedBuffer]),
      buffer15.slice(4, 4 + emittedBuffer.length)
    )
  })

  test('the buffer should not be empty afterwards (half a frame messages)', () => {
    const parser = new Parser()
    const messages = parser.parse(buffer15)
    const emittedBuffer = messages[0].data
    assert.equal(
      (parser as any)._chunks[0],
      buffer15.slice(4 + emittedBuffer.length)
    )
  })
})

describe('2 buffers = 1,5 +0,5 rtp package', (test) => {
  let buffer15: Buffer
  let buffer05: Buffer
  test.before(() => {
    buffer15 = Buffer.alloc(frames.onePointFive.length)
    frames.onePointFive.forEach((byte, index) => {
      buffer15[index] = byte
    })
    buffer05 = Buffer.alloc(frames.zeroPointFive.length)
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
  let RtspBuffer: Buffer
  test.before(() => {
    RtspBuffer = Buffer.alloc(setupResponse.length)
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
    assert.equal(msg.data, Buffer.from(setupResponse))
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
  let sdpBuffer: Buffer
  test.before(() => {
    sdpBuffer = Buffer.from(sdpResponse)
  })

  test('should extract twice, once with the full RTSP and once with the SDP data', () => {
    const parser = new Parser()
    const messages: Array<any> = parser.parse(sdpBuffer)
    assert.is(messages.length, 2)
    assert.is(messages[0].type, MessageType.RTSP)
    assert.is(messages[1].type, MessageType.SDP)
    assert.equal(messages[0].data, sdpBuffer)
    const msg = messages[1]
    const b = msg.data
    // Should contain the full SDP data
    assert.is(b.length, 623)
    assert.is(typeof msg.sdp, 'object')
    assert.is(typeof msg.sdp.session, 'object')
    assert.ok(Array.isArray(msg.sdp.media))

    // Should start correctly
    assert.is(b.toString('ascii', 0, 3), 'v=0')

    // Should end correctly
    assert.is(b.toString('ascii', b.length - 3), '0\r\n')
  })

  test('should handle segmented RTSP/SDP', () => {
    const parser = new Parser()
    const segmentedRTSP = sdpResponse.split(/(?<=\r\n\r\n)/g)
    const RTSPBuffer: Buffer = Buffer.from(segmentedRTSP[0])
    const SDPBuffer: Buffer = Buffer.from(segmentedRTSP[1])
    let messages = parser.parse(RTSPBuffer)
    assert.is(messages.length, 0)
    messages = parser.parse(SDPBuffer)
    assert.is(messages.length, 2)
  })
})
