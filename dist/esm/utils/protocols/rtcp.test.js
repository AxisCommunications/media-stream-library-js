import { rtcpBuffers } from './fixtures';
import { count, packetType, padding, SR, version } from './rtcp';
describe('Rtcp parsing', () => {
    for (const buffer of rtcpBuffers) {
        it('is parsed correctly', () => {
            expect(version(buffer)).toEqual(2);
            expect(padding(buffer)).toEqual(false);
            expect(count(buffer)).toEqual(0);
            expect(packetType(buffer)).toEqual(SR.packetType);
            expect(SR.syncSource(buffer)).toEqual(4197078097);
        });
    }
    it('should expose correct ntpMost', () => {
        expect(SR.ntpMost(rtcpBuffers[0])).toEqual(3668306118);
        expect(SR.ntpMost(rtcpBuffers[1])).toEqual(3668306118);
        expect(SR.ntpMost(rtcpBuffers[2])).toEqual(3668306131);
    });
    it('should have the correct ntpLeast', () => {
        expect(SR.ntpLeast(rtcpBuffers[0])).toEqual(445534137);
        expect(SR.ntpLeast(rtcpBuffers[1])).toEqual(445534137);
        expect(SR.ntpLeast(rtcpBuffers[2])).toEqual(1936420365);
    });
    it('should have the correct senders packet count', () => {
        expect(SR.sendersPacketCount(rtcpBuffers[0])).toEqual(1734);
        expect(SR.sendersPacketCount(rtcpBuffers[1])).toEqual(1734);
        expect(SR.sendersPacketCount(rtcpBuffers[2])).toEqual(1840);
    });
    it('should have the correct senders octet count', () => {
        expect(SR.sendersOctetCount(rtcpBuffers[0])).toEqual(1278825);
        expect(SR.sendersOctetCount(rtcpBuffers[1])).toEqual(1278825);
        expect(SR.sendersOctetCount(rtcpBuffers[2])).toEqual(1357000);
    });
});
//# sourceMappingURL=rtcp.test.js.map