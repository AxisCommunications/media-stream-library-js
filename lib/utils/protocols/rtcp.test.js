const Rtcp = require('./rtcp')
const { rtcpBuffers } = require('./fixtures')
const given = require('mocha-testdata')

describe('Rtcp parsing', () => {
  given(rtcpBuffers).it('is parsed correctly', function (buffer) {
    expect(Rtcp.version(buffer)).toEqual(2)
    expect(Rtcp.padding(buffer)).toEqual(false)
    expect(Rtcp.count(buffer)).toEqual(0)
    expect(Rtcp.packetType(buffer)).toEqual(Rtcp.SR.packetType)
    expect(Rtcp.SR.syncSource(buffer)).toEqual(4197078097)
  })

  it('should expose correct ntpMost', () => {
    expect(Rtcp.SR.ntpMost(rtcpBuffers[0])).toEqual(3668306118)
    expect(Rtcp.SR.ntpMost(rtcpBuffers[1])).toEqual(3668306118)
    expect(Rtcp.SR.ntpMost(rtcpBuffers[2])).toEqual(3668306131)
  })

  it('should have the correct ntpLeast', () => {
    expect(Rtcp.SR.ntpLeast(rtcpBuffers[0])).toEqual(445534137)
    expect(Rtcp.SR.ntpLeast(rtcpBuffers[1])).toEqual(445534137)
    expect(Rtcp.SR.ntpLeast(rtcpBuffers[2])).toEqual(1936420365)
  })

  it('should have the correct senders packet count', () => {
    expect(Rtcp.SR.sendersPacketCount(rtcpBuffers[0])).toEqual(1734)
    expect(Rtcp.SR.sendersPacketCount(rtcpBuffers[1])).toEqual(1734)
    expect(Rtcp.SR.sendersPacketCount(rtcpBuffers[2])).toEqual(1840)
  })

  it('should have the correct senders octet count', () => {
    expect(Rtcp.SR.sendersOctetCount(rtcpBuffers[0])).toEqual(1278825)
    expect(Rtcp.SR.sendersOctetCount(rtcpBuffers[1])).toEqual(1278825)
    expect(Rtcp.SR.sendersOctetCount(rtcpBuffers[2])).toEqual(1357000)
  })
})
