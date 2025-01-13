import * as assert from 'uvu/assert'
import { describe } from './uvu-describe'

import {
  frames,
  optionsRequest,
  rtspRtpRtcpCombined,
  rtspWithTrailingRtp,
  sdpResponse,
  setupResponse,
} from './rtsp-parser.fixtures'

import type { RtspRequestMessage } from '../src/streams/components'

import { RtspParser } from '../src/streams/components/rtsp/parser'
import { serialize } from '../src/streams/components/rtsp/serializer'
import { concat, decode, encode } from '../src/streams/components/utils/bytes'

describe('parsing of interleaved data', (test) => {
  test('can append buffers', () => {
    const parser = new RtspParser()
    const a = parser.parse(new Uint8Array(0))
    assert.equal(a, [])
  })

  test('should handle a [36, 0, x] buffer correctly', () => {
    const parser = new RtspParser()
    const messages = parser.parse(new Uint8Array([36, 0, 5]))
    assert.is(messages.length, 0)

    // @ts-ignore access private property
    assert.is(parser.length, 3)
  })

  test('should handle a [36] buffer correctly', () => {
    const parser = new RtspParser()
    const messages = parser.parse(new Uint8Array([36]))
    assert.is(messages.length, 0)

    // @ts-ignore access private property
    assert.is(parser.length, 1)
  })

  test('should throw an error when coming across an unknown buffer', () => {
    const parser = new RtspParser()
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
    const parser = new RtspParser()
    const messages = parser.parse(buffer1)
    assert.is(messages.length, 1)
  })

  test('extracts message with correct data', () => {
    const parser = new RtspParser()
    const messages = parser.parse(buffer1)
    const msg = messages[0]
    assert.ok(msg.type === 'rtp', 'should be RTP message')
    assert.equal(concat([msg.data]), buffer1.slice(16))

    assert.is((msg as any).channel, 0)
  })

  test('the buffer should be empty afterwards (no messages data buffered)', () => {
    const parser = new RtspParser()
    parser.parse(buffer1)

    // @ts-ignore access private property
    assert.is(parser.length, 0)
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
    const parser = new RtspParser()
    const messages = parser.parse(buffer15)
    assert.is(messages.length, 1)
  })

  test('extracts the full rtp frame', () => {
    const parser = new RtspParser()
    const messages = parser.parse(buffer15)
    const msg = messages[0]
    assert.ok(msg.type === 'rtp', 'should be RTP message')
    const emittedBuffer = msg.data
    assert.is(msg.type, 'rtp')
    assert.equal(
      concat([emittedBuffer]),
      buffer15.slice(16, 16 + emittedBuffer.length)
    )
  })

  test('the buffer should not be empty afterwards (half a frame messages)', () => {
    const parser = new RtspParser()
    const messages = parser.parse(buffer15)
    const msg = messages[0]
    assert.ok(msg.type === 'rtp', 'should be RTP message')
    const emittedBuffer = msg.data
    assert.equal(
      // @ts-ignore access private property
      parser.chunks[0],
      buffer15.slice(16 + emittedBuffer.length)
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
    const parser = new RtspParser()
    let messages = parser.parse(buffer15)
    assert.is(messages.length, 1)

    // @ts-ignore access private property
    assert.ok(parser.length > 0)
    messages = parser.parse(buffer05)
    assert.is(messages.length, 1)
  })

  test('the buffer should be empty afterwards', () => {
    const parser = new RtspParser()
    parser.parse(buffer15)
    parser.parse(buffer05)

    // @ts-ignore access private property
    assert.is(parser.length, 0)
  })
})

describe('RTSP package', (test) => {
  let RtspBuffer: Uint8Array
  test.before(() => {
    RtspBuffer = encode(setupResponse)
  })

  test('extracts the RTSP buffer', () => {
    const parser = new RtspParser()
    const messages = parser.parse(RtspBuffer)
    assert.is(messages.length, 1)
    const msg = messages[0]
    assert.ok(msg.type === 'rtsp_rsp')
    assert.equal(
      msg.headers.get('RTP-Info'),
      'url=rtsp://192.168.0.3/axis-media/media.amp/stream=0?resolution=176x144&fps=1;seq=10176;rtptime=2419713327'
    )
  })

  test('the buffer should be empty afterwards (no messages data buffered)', () => {
    const parser = new RtspParser()
    parser.parse(RtspBuffer)

    // @ts-ignore access private property
    assert.is(parser.length, 0)
  })

  test('should detect RTP data in same buffer as RTSP', () => {
    const parser = new RtspParser()
    parser.parse(rtspWithTrailingRtp)

    // @ts-ignore access private property
    assert.is(parser.length, 4)
  })

  test('should find RTSP, RTP and RTCP packages in the same buffer', () => {
    const parser = new RtspParser()
    const messages: Array<any> = parser.parse(rtspRtpRtcpCombined)
    assert.is(messages.length, 4)
    assert.is(messages[0].type, 'rtsp_rsp')
    assert.is(messages[1].type, 'rtp')
    assert.is(messages[1].channel, 0)
    assert.is(messages[2].type, 'rtcp')
    assert.is(messages[2].channel, 1)
    assert.is(messages[3].type, 'rtcp')
    assert.is(messages[3].channel, 1)
  })
})

describe('SDP data', (test) => {
  let sdpBuffer: Uint8Array
  let sdpBody: Uint8Array
  test.before(() => {
    sdpBuffer = encode(sdpResponse)
    sdpBody = encode(sdpResponse.split('\r\n\r\n')[1])
  })

  test('should extract SDP data', () => {
    const parser = new RtspParser()
    const messages = parser.parse(sdpBuffer)
    assert.is(messages.length, 1)
    const msg = messages[0]
    assert.ok(msg.type === 'rtsp_rsp')
    assert.equal(msg.body, sdpBody)
  })

  test('should handle segmented RTSP/SDP', () => {
    const parser = new RtspParser()
    const segmentedRTSP = sdpResponse.split(/(?<=\r\n\r\n)/g)
    const part1: Uint8Array = encode(segmentedRTSP[0])
    const part2: Uint8Array = encode(segmentedRTSP[1])
    let messages = parser.parse(part1)
    assert.is(messages.length, 0)
    messages = parser.parse(part2)
    assert.is(messages.length, 1)
  })
})

describe('rtsp request serializer', (test) => {
  test('builds a valid RTSP message from the passed in data', () => {
    const msg: RtspRequestMessage = {
      type: 'rtsp_req',
      method: 'OPTIONS',
      uri: 'rtsp://192.168.0.3/axis-media/media.amp?resolution=176x144&fps=1',
      headers: {
        CSeq: 1,
        Date: 'Wed, 03 Jun 2015 14:26:16 GMT',
      },
    }
    const data = serialize(msg)

    assert.is(decode(data), optionsRequest)
  })
})
