const Rtp = require('./rtp')
const { rtpBuffers, rtpBuffersWithHeaderExt } = require('./fixtures')
const given = require('mocha-testdata')

describe('Rtp parsing', () => {
  given(rtpBuffers).it('is parsed correctly', function (buffer) {
    expect(Rtp.version(buffer)).toEqual(2)
    expect(Rtp.padding(buffer)).toEqual(false)
    expect(Rtp.extension(buffer)).toEqual(false)
    expect(Rtp.sSrc(buffer)).toEqual(431929961)
  })

  given(rtpBuffersWithHeaderExt).it('is parsed correctly', function (buffer) {
    expect(Rtp.version(buffer)).toEqual(2)
    expect(Rtp.padding(buffer)).toEqual(false)
    expect(Rtp.extension(buffer)).toEqual(true)
    expect(Rtp.sSrc(buffer)).toEqual(431929961)
  })

  it('should expose correct cSrcCount', () => {
    expect(Rtp.cSrcCount(rtpBuffers[0])).toEqual(0)
    expect(Rtp.cSrcCount(rtpBuffers[1])).toEqual(0)
    expect(Rtp.cSrcCount(rtpBuffers[2])).toEqual(1)
  })

  it('should expose correct cSrc', () => {
    expect(Rtp.cSrc(rtpBuffers[0])).toEqual(0)
    expect(Rtp.cSrc(rtpBuffers[1])).toEqual(0)
    expect(Rtp.cSrc(rtpBuffers[2])).toEqual(1)
  })

  it('should have the correct timestamps', () => {
    expect(Rtp.timestamp(rtpBuffers[0])).toEqual(3777434756)
    expect(Rtp.timestamp(rtpBuffers[1])).toEqual(3777457249)
    expect(Rtp.timestamp(rtpBuffers[2])).toEqual(3777509736)
  })

  it('should have the correct sequence number', () => {
    expect(Rtp.sequenceNumber(rtpBuffers[0])).toEqual(20536)
    expect(Rtp.sequenceNumber(rtpBuffers[1])).toEqual(20556)
    expect(Rtp.sequenceNumber(rtpBuffers[2])).toEqual(20575)
  })

  it('should have the correct Payload Type & Marker Flags', () => {
    expect(Rtp.marker(rtpBuffers[0])).toEqual(false)
    expect(Rtp.marker(rtpBuffers[1])).toEqual(true)
    expect(Rtp.marker(rtpBuffers[2])).toEqual(true)
    expect(Rtp.payloadType(rtpBuffers[0])).toEqual(96)
    expect(Rtp.payloadType(rtpBuffers[1])).toEqual(96)
    expect(Rtp.payloadType(rtpBuffers[2])).toEqual(96)
  })

  it('should expose the payload', () => {
    expect(Rtp.payload(rtpBuffers[0])).toEqual(Buffer.from([]))
    expect(Rtp.payload(rtpBuffers[1])).toEqual(Buffer.from([1, 2, 3]))
    expect(Rtp.payload(rtpBuffers[2])).toEqual(Buffer.from([1, 2, 3]))
    expect(Rtp.payload(rtpBuffersWithHeaderExt[0])).toEqual(Buffer.from([1, 2, 3]))
    expect(Rtp.payload(rtpBuffersWithHeaderExt[1])).toEqual(Buffer.from([1, 2, 3]))
  })

  it('should expose the extension header', () => {
    expect(Rtp.extHeader(rtpBuffers[0])).toEqual(Buffer.from([]))
    expect(Rtp.extHeader(rtpBuffers[1])).toEqual(Buffer.from([]))
    expect(Rtp.extHeader(rtpBuffers[2])).toEqual(Buffer.from([]))
    expect(Rtp.extHeader(rtpBuffersWithHeaderExt[0])).toEqual(Buffer.from([]))
    expect(Rtp.extHeader(rtpBuffersWithHeaderExt[1])).toEqual(Buffer.from([1, 2, 0, 1, 1, 2, 3, 4]))
  })
})
