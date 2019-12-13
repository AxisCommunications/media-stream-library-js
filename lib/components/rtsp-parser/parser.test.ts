import { Parser } from './parser'
import {
  frames,
  setupResponse,
  rtspRtpRtcpCombined,
  rtspWithTrailingRtp,
  sdpResponse,
} from './fixtures'
import { MessageType } from '../message'

describe('Parsing of interleaved data', () => {
  let parser: Parser
  let messages: any[] = []

  beforeEach(() => {
    parser = new Parser()
    messages = []
  })

  test('can append buffers', () => {
    expect(() => {
      parser.parse(Buffer.alloc(0))
    }).not.toThrow()
  })

  describe('error handling', () => {
    test('should handle a [36, 0, x] buffer correctly', () => {
      expect(() => {
        messages = parser.parse(Buffer.from([36, 0, 5]))
      }).not.toThrow()
      expect(messages.length).toBe(0)
      expect((parser as any)._length).toBe(3)
    })

    test('should handle a [36] buffer correctly', () => {
      expect(() => {
        messages = parser.parse(Buffer.from([36]))
      }).not.toThrow()
      expect(messages.length).toBe(0)
      expect((parser as any)._length).toBe(1)
    })

    test('should throw an error when coming across an unknown buffer', () => {
      expect(() => parser.parse(Buffer.from([1, 2, 3]))).toThrow()
    })
  })

  describe('1 buffer = 1 rtp package', () => {
    let buffer1: Buffer
    beforeAll(() => {
      buffer1 = Buffer.alloc(frames.onePointZero.length)
      frames.onePointZero.map((byte, index) => {
        buffer1[index] = byte
      })
    })

    test('extracts one message', () => {
      messages = parser.parse(buffer1)
      expect(messages.length).toBe(1)
    })

    test('extracts message with correct data', () => {
      messages = parser.parse(buffer1)
      const msg = messages[0]
      expect(Buffer.concat([msg.data])).toEqual(buffer1.slice(4))
      expect(msg.channel).toEqual(0)
    })

    test('the buffer should be empty afterwards (no messages data buffered)', () => {
      messages = parser.parse(buffer1)
      expect((parser as any)._length).toEqual(0)
    })
  })
  describe('1 buffer = 1,5 rtp package', () => {
    let buffer15: Buffer
    beforeAll(() => {
      buffer15 = Buffer.alloc(frames.onePointFive.length)
      frames.onePointFive.map((byte, index) => {
        buffer15[index] = byte
      })
    })

    test('extracts one message', () => {
      messages = parser.parse(buffer15)
      expect(messages.length).toBe(1)
    })

    test('extracts the full rtp frame', () => {
      messages = parser.parse(buffer15)
      const msg = messages[0]
      const emittedBuffer = msg.data
      expect(msg.type).toEqual(MessageType.RTP)
      expect(Buffer.concat([emittedBuffer])).toEqual(
        buffer15.slice(4, 4 + emittedBuffer.length),
      )
    })

    test('the buffer should not be empty afterwards (half a frame messages)', () => {
      messages = parser.parse(buffer15)
      const emittedBuffer = messages[0].data
      expect((parser as any)._chunks[0]).toEqual(
        buffer15.slice(4 + emittedBuffer.length),
      )
    })
  })

  describe('2 buffers = 1,5 +0,5 rtp package', () => {
    let buffer15: Buffer
    let buffer05: Buffer
    beforeAll(() => {
      buffer15 = Buffer.alloc(frames.onePointFive.length)
      frames.onePointFive.map((byte, index) => {
        buffer15[index] = byte
      })
      buffer05 = Buffer.alloc(frames.zeroPointFive.length)
      frames.zeroPointFive.map((byte, index) => {
        buffer05[index] = byte
      })
    })

    test('extracts two messages', () => {
      messages = parser.parse(buffer15)
      expect(messages.length).toBe(1)
      expect((parser as any)._length).toBeGreaterThan(0)
      messages = parser.parse(buffer05)
      expect(messages.length).toBe(1)
    })

    test('the buffer should be empty afterwards', () => {
      messages = parser.parse(buffer15)
      messages = parser.parse(buffer05)
      expect((parser as any)._length).toBe(0)
    })
  })

  describe('RTSP package', () => {
    let RtspBuffer: Buffer
    beforeAll(() => {
      RtspBuffer = Buffer.alloc(setupResponse.length)
      setupResponse.split('').map((character, index) => {
        RtspBuffer[index] = character.charCodeAt(0)
      })
    })

    test('extracts the RTSP buffer', () => {
      messages = parser.parse(RtspBuffer)
      expect(messages.length).toBe(1)
      const msg = messages[0]
      expect(msg.type).toEqual(MessageType.RTSP)
      expect(msg.data).toEqual(Buffer.from(setupResponse))
    })

    test('the buffer should be empty afterwards (no messages data buffered)', () => {
      messages = parser.parse(RtspBuffer)
      expect((parser as any)._length).toEqual(0)
    })

    test('should detect RTP data in same buffer as RTSP', () => {
      messages = parser.parse(rtspWithTrailingRtp)
      expect((parser as any)._length).toEqual(4)
    })

    test('should find RTSP, RTP and RTCP packages in the same buffer', () => {
      messages = parser.parse(rtspRtpRtcpCombined)
      expect(messages.length).toBe(4)
      expect(messages[0].type).toEqual(MessageType.RTSP)
      expect(messages[1].type).toEqual(MessageType.RTP)
      expect(messages[1].channel).toEqual(0)
      expect(messages[2].type).toEqual(MessageType.RTCP)
      expect(messages[2].channel).toEqual(1)
      expect(messages[3].type).toEqual(MessageType.RTCP)
      expect(messages[3].channel).toEqual(1)
    })
  })

  describe('SDP data', () => {
    let sdpBuffer: Buffer
    beforeAll(() => {
      sdpBuffer = Buffer.from(sdpResponse)
    })

    test('should extract twice, once with the full RTSP and once with the SDP data', () => {
      messages = parser.parse(sdpBuffer)
      expect(messages.length).toBe(2)
      expect(messages[0].type).toEqual(MessageType.RTSP)
      expect(messages[1].type).toEqual(MessageType.SDP)
      expect(messages[0].data).toEqual(sdpBuffer)
      const msg = messages[1]
      const b = msg.data
      // Should contain the full SDP data
      expect(b.length).toEqual(623)
      expect(msg.sdp).toBeInstanceOf(Object)
      expect(msg.sdp.session).toBeInstanceOf(Object)
      expect(msg.sdp.media).toBeInstanceOf(Array)

      // Should start correctly
      expect(b.toString('ascii', 0, 3)).toEqual('v=0')

      // Should end correctly
      expect(b.toString('ascii', b.length - 3)).toEqual('0\r\n')
    })

    test('should handle segmented RTSP/SDP', () => {
      const segmentedRTSP = sdpResponse.split(/(?<=\r\n\r\n)/g)
      const RTSPBuffer: Buffer = Buffer.from(segmentedRTSP[0])
      const SDPBuffer: Buffer = Buffer.from(segmentedRTSP[1])
      messages = parser.parse(RTSPBuffer)
      expect(messages.length).toBe(0)
      messages = parser.parse(SDPBuffer)
      expect(messages.length).toBe(2)
    })
  })
})
