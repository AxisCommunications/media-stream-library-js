"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fixtures_1 = require("./fixtures");
const rtcp_1 = require("./rtcp");
describe('Rtcp parsing', () => {
    for (const buffer of fixtures_1.rtcpBuffers) {
        it('is parsed correctly', () => {
            expect(rtcp_1.version(buffer)).toEqual(2);
            expect(rtcp_1.padding(buffer)).toEqual(false);
            expect(rtcp_1.count(buffer)).toEqual(0);
            expect(rtcp_1.packetType(buffer)).toEqual(rtcp_1.SR.packetType);
            expect(rtcp_1.SR.syncSource(buffer)).toEqual(4197078097);
        });
    }
    it('should expose correct ntpMost', () => {
        expect(rtcp_1.SR.ntpMost(fixtures_1.rtcpBuffers[0])).toEqual(3668306118);
        expect(rtcp_1.SR.ntpMost(fixtures_1.rtcpBuffers[1])).toEqual(3668306118);
        expect(rtcp_1.SR.ntpMost(fixtures_1.rtcpBuffers[2])).toEqual(3668306131);
    });
    it('should have the correct ntpLeast', () => {
        expect(rtcp_1.SR.ntpLeast(fixtures_1.rtcpBuffers[0])).toEqual(445534137);
        expect(rtcp_1.SR.ntpLeast(fixtures_1.rtcpBuffers[1])).toEqual(445534137);
        expect(rtcp_1.SR.ntpLeast(fixtures_1.rtcpBuffers[2])).toEqual(1936420365);
    });
    it('should have the correct senders packet count', () => {
        expect(rtcp_1.SR.sendersPacketCount(fixtures_1.rtcpBuffers[0])).toEqual(1734);
        expect(rtcp_1.SR.sendersPacketCount(fixtures_1.rtcpBuffers[1])).toEqual(1734);
        expect(rtcp_1.SR.sendersPacketCount(fixtures_1.rtcpBuffers[2])).toEqual(1840);
    });
    it('should have the correct senders octet count', () => {
        expect(rtcp_1.SR.sendersOctetCount(fixtures_1.rtcpBuffers[0])).toEqual(1278825);
        expect(rtcp_1.SR.sendersOctetCount(fixtures_1.rtcpBuffers[1])).toEqual(1278825);
        expect(rtcp_1.SR.sendersOctetCount(fixtures_1.rtcpBuffers[2])).toEqual(1357000);
    });
});
//# sourceMappingURL=rtcp.test.js.map