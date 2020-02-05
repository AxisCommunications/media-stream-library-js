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
import { rtpBuffers, rtpBuffersWithHeaderExt } from './fixtures';
import { cSrcCount, extension, marker, padding, payload, payloadType, sequenceNumber, sSrc, timestamp, version, extHeader, cSrc, } from './rtp';
describe('Rtp parsing', function () {
    var e_1, _a, e_2, _b;
    var _loop_1 = function (buffer) {
        it('is parsed correctly', function () {
            expect(version(buffer)).toEqual(2);
            expect(padding(buffer)).toEqual(false);
            expect(extension(buffer)).toEqual(false);
            expect(sSrc(buffer)).toEqual(431929961);
        });
    };
    try {
        for (var rtpBuffers_1 = __values(rtpBuffers), rtpBuffers_1_1 = rtpBuffers_1.next(); !rtpBuffers_1_1.done; rtpBuffers_1_1 = rtpBuffers_1.next()) {
            var buffer = rtpBuffers_1_1.value;
            _loop_1(buffer);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (rtpBuffers_1_1 && !rtpBuffers_1_1.done && (_a = rtpBuffers_1.return)) _a.call(rtpBuffers_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    var _loop_2 = function (buffer) {
        it('is parsed correctly', function () {
            expect(version(buffer)).toEqual(2);
            expect(padding(buffer)).toEqual(false);
            expect(extension(buffer)).toEqual(true);
            expect(sSrc(buffer)).toEqual(431929961);
        });
    };
    try {
        for (var rtpBuffersWithHeaderExt_1 = __values(rtpBuffersWithHeaderExt), rtpBuffersWithHeaderExt_1_1 = rtpBuffersWithHeaderExt_1.next(); !rtpBuffersWithHeaderExt_1_1.done; rtpBuffersWithHeaderExt_1_1 = rtpBuffersWithHeaderExt_1.next()) {
            var buffer = rtpBuffersWithHeaderExt_1_1.value;
            _loop_2(buffer);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (rtpBuffersWithHeaderExt_1_1 && !rtpBuffersWithHeaderExt_1_1.done && (_b = rtpBuffersWithHeaderExt_1.return)) _b.call(rtpBuffersWithHeaderExt_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    it('should expose correct cSrcCount', function () {
        expect(cSrcCount(rtpBuffers[0])).toEqual(0);
        expect(cSrcCount(rtpBuffers[1])).toEqual(0);
        expect(cSrcCount(rtpBuffers[2])).toEqual(1);
    });
    it('should expose correct cSrc', function () {
        expect(cSrc(rtpBuffers[0])).toEqual(0);
        expect(cSrc(rtpBuffers[1])).toEqual(0);
        expect(cSrc(rtpBuffers[2])).toEqual(1);
    });
    it('should have the correct timestamps', function () {
        expect(timestamp(rtpBuffers[0])).toEqual(3777434756);
        expect(timestamp(rtpBuffers[1])).toEqual(3777457249);
        expect(timestamp(rtpBuffers[2])).toEqual(3777509736);
    });
    it('should have the correct sequence number', function () {
        expect(sequenceNumber(rtpBuffers[0])).toEqual(20536);
        expect(sequenceNumber(rtpBuffers[1])).toEqual(20556);
        expect(sequenceNumber(rtpBuffers[2])).toEqual(20575);
    });
    it('should have the correct Payload Type & Marker Flags', function () {
        expect(marker(rtpBuffers[0])).toEqual(false);
        expect(marker(rtpBuffers[1])).toEqual(true);
        expect(marker(rtpBuffers[2])).toEqual(true);
        expect(payloadType(rtpBuffers[0])).toEqual(96);
        expect(payloadType(rtpBuffers[1])).toEqual(96);
        expect(payloadType(rtpBuffers[2])).toEqual(96);
    });
    it('should expose the payload', function () {
        expect(payload(rtpBuffers[0])).toEqual(Buffer.from([]));
        expect(payload(rtpBuffers[1])).toEqual(Buffer.from([1, 2, 3]));
        expect(payload(rtpBuffers[2])).toEqual(Buffer.from([1, 2, 3]));
        expect(payload(rtpBuffersWithHeaderExt[0])).toEqual(Buffer.from([1, 2, 3]));
        expect(payload(rtpBuffersWithHeaderExt[1])).toEqual(Buffer.from([1, 2, 3]));
    });
    it('should expose the extension header', function () {
        expect(extHeader(rtpBuffers[0])).toEqual(Buffer.from([]));
        expect(extHeader(rtpBuffers[1])).toEqual(Buffer.from([]));
        expect(extHeader(rtpBuffers[2])).toEqual(Buffer.from([]));
        expect(extHeader(rtpBuffersWithHeaderExt[0])).toEqual(Buffer.from([]));
        expect(extHeader(rtpBuffersWithHeaderExt[1])).toEqual(Buffer.from([1, 2, 0, 1, 1, 2, 3, 4]));
    });
});
//# sourceMappingURL=rtp.test.js.map