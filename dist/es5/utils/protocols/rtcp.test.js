var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { rtcpBuffers } from './fixtures';
import { count, packetType, padding, SR, version } from './rtcp';
describe('Rtcp parsing', function () {
    var e_1, _a;
    var _loop_1 = function (buffer) {
        it('is parsed correctly', function () {
            expect(version(buffer)).toEqual(2);
            expect(padding(buffer)).toEqual(false);
            expect(count(buffer)).toEqual(0);
            expect(packetType(buffer)).toEqual(SR.packetType);
            expect(SR.syncSource(buffer)).toEqual(4197078097);
        });
    };
    try {
        for (var rtcpBuffers_1 = __values(rtcpBuffers), rtcpBuffers_1_1 = rtcpBuffers_1.next(); !rtcpBuffers_1_1.done; rtcpBuffers_1_1 = rtcpBuffers_1.next()) {
            var buffer = rtcpBuffers_1_1.value;
            _loop_1(buffer);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (rtcpBuffers_1_1 && !rtcpBuffers_1_1.done && (_a = rtcpBuffers_1.return)) _a.call(rtcpBuffers_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    it('should expose correct ntpMost', function () {
        expect(SR.ntpMost(rtcpBuffers[0])).toEqual(3668306118);
        expect(SR.ntpMost(rtcpBuffers[1])).toEqual(3668306118);
        expect(SR.ntpMost(rtcpBuffers[2])).toEqual(3668306131);
    });
    it('should have the correct ntpLeast', function () {
        expect(SR.ntpLeast(rtcpBuffers[0])).toEqual(445534137);
        expect(SR.ntpLeast(rtcpBuffers[1])).toEqual(445534137);
        expect(SR.ntpLeast(rtcpBuffers[2])).toEqual(1936420365);
    });
    it('should have the correct senders packet count', function () {
        expect(SR.sendersPacketCount(rtcpBuffers[0])).toEqual(1734);
        expect(SR.sendersPacketCount(rtcpBuffers[1])).toEqual(1734);
        expect(SR.sendersPacketCount(rtcpBuffers[2])).toEqual(1840);
    });
    it('should have the correct senders octet count', function () {
        expect(SR.sendersOctetCount(rtcpBuffers[0])).toEqual(1278825);
        expect(SR.sendersOctetCount(rtcpBuffers[1])).toEqual(1278825);
        expect(SR.sendersOctetCount(rtcpBuffers[2])).toEqual(1357000);
    });
});
//# sourceMappingURL=rtcp.test.js.map