import { rtpBuffers, rtpBuffersWithHeaderExt } from './fixtures'
import {
  cSrcCount,
  extension,
  marker,
  padding,
  payload,
  payloadType,
  sequenceNumber,
  sSrc,
  timestamp,
  version,
  extHeader,
  cSrc,
} from './rtp'

describe('Rtp parsing', () => {
  for (const buffer of rtpBuffers) {
    it('is parsed correctly', () => {
      expect(version(buffer)).toEqual(2)
      expect(padding(buffer)).toEqual(false)
      expect(extension(buffer)).toEqual(false)
      expect(sSrc(buffer)).toEqual(431929961)
    })
  }

  for (const buffer of rtpBuffersWithHeaderExt) {
    it('is parsed correctly', () => {
      expect(version(buffer)).toEqual(2)
      expect(padding(buffer)).toEqual(false)
      expect(extension(buffer)).toEqual(true)
      expect(sSrc(buffer)).toEqual(431929961)
    })
  }

  it('should expose correct cSrcCount', () => {
    expect(cSrcCount(rtpBuffers[0])).toEqual(0)
    expect(cSrcCount(rtpBuffers[1])).toEqual(0)
    expect(cSrcCount(rtpBuffers[2])).toEqual(1)
  })

  it('should expose correct cSrc', () => {
    expect(cSrc(rtpBuffers[0])).toEqual(0)
    expect(cSrc(rtpBuffers[1])).toEqual(0)
    expect(cSrc(rtpBuffers[2])).toEqual(1)
  })

  it('should have the correct timestamps', () => {
    expect(timestamp(rtpBuffers[0])).toEqual(3777434756)
    expect(timestamp(rtpBuffers[1])).toEqual(3777457249)
    expect(timestamp(rtpBuffers[2])).toEqual(3777509736)
  })

  it('should have the correct sequence number', () => {
    expect(sequenceNumber(rtpBuffers[0])).toEqual(20536)
    expect(sequenceNumber(rtpBuffers[1])).toEqual(20556)
    expect(sequenceNumber(rtpBuffers[2])).toEqual(20575)
  })

  it('should have the correct Payload Type & Marker Flags', () => {
    expect(marker(rtpBuffers[0])).toEqual(false)
    expect(marker(rtpBuffers[1])).toEqual(true)
    expect(marker(rtpBuffers[2])).toEqual(true)
    expect(payloadType(rtpBuffers[0])).toEqual(96)
    expect(payloadType(rtpBuffers[1])).toEqual(96)
    expect(payloadType(rtpBuffers[2])).toEqual(96)
  })

  it('should expose the payload', () => {
    expect(payload(rtpBuffers[0])).toEqual(Buffer.from([]))
    expect(payload(rtpBuffers[1])).toEqual(Buffer.from([1, 2, 3]))
    expect(payload(rtpBuffers[2])).toEqual(Buffer.from([1, 2, 3]))
    expect(payload(rtpBuffersWithHeaderExt[0])).toEqual(Buffer.from([1, 2, 3]))
    expect(payload(rtpBuffersWithHeaderExt[1])).toEqual(Buffer.from([1, 2, 3]))
  })

  it('should expose the extension header', () => {
    expect(extHeader(rtpBuffers[0])).toEqual(Buffer.from([]))
    expect(extHeader(rtpBuffers[1])).toEqual(Buffer.from([]))
    expect(extHeader(rtpBuffers[2])).toEqual(Buffer.from([]))
    expect(extHeader(rtpBuffersWithHeaderExt[0])).toEqual(Buffer.from([]))
    expect(extHeader(rtpBuffersWithHeaderExt[1])).toEqual(
      Buffer.from([1, 2, 0, 1, 1, 2, 3, 4]),
    )
  })
})
