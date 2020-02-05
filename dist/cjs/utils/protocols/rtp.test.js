"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fixtures_1 = require("./fixtures");
const rtp_1 = require("./rtp");
describe('Rtp parsing', () => {
    for (const buffer of fixtures_1.rtpBuffers) {
        it('is parsed correctly', () => {
            expect(rtp_1.version(buffer)).toEqual(2);
            expect(rtp_1.padding(buffer)).toEqual(false);
            expect(rtp_1.extension(buffer)).toEqual(false);
            expect(rtp_1.sSrc(buffer)).toEqual(431929961);
        });
    }
    for (const buffer of fixtures_1.rtpBuffersWithHeaderExt) {
        it('is parsed correctly', () => {
            expect(rtp_1.version(buffer)).toEqual(2);
            expect(rtp_1.padding(buffer)).toEqual(false);
            expect(rtp_1.extension(buffer)).toEqual(true);
            expect(rtp_1.sSrc(buffer)).toEqual(431929961);
        });
    }
    it('should expose correct cSrcCount', () => {
        expect(rtp_1.cSrcCount(fixtures_1.rtpBuffers[0])).toEqual(0);
        expect(rtp_1.cSrcCount(fixtures_1.rtpBuffers[1])).toEqual(0);
        expect(rtp_1.cSrcCount(fixtures_1.rtpBuffers[2])).toEqual(1);
    });
    it('should expose correct cSrc', () => {
        expect(rtp_1.cSrc(fixtures_1.rtpBuffers[0])).toEqual(0);
        expect(rtp_1.cSrc(fixtures_1.rtpBuffers[1])).toEqual(0);
        expect(rtp_1.cSrc(fixtures_1.rtpBuffers[2])).toEqual(1);
    });
    it('should have the correct timestamps', () => {
        expect(rtp_1.timestamp(fixtures_1.rtpBuffers[0])).toEqual(3777434756);
        expect(rtp_1.timestamp(fixtures_1.rtpBuffers[1])).toEqual(3777457249);
        expect(rtp_1.timestamp(fixtures_1.rtpBuffers[2])).toEqual(3777509736);
    });
    it('should have the correct sequence number', () => {
        expect(rtp_1.sequenceNumber(fixtures_1.rtpBuffers[0])).toEqual(20536);
        expect(rtp_1.sequenceNumber(fixtures_1.rtpBuffers[1])).toEqual(20556);
        expect(rtp_1.sequenceNumber(fixtures_1.rtpBuffers[2])).toEqual(20575);
    });
    it('should have the correct Payload Type & Marker Flags', () => {
        expect(rtp_1.marker(fixtures_1.rtpBuffers[0])).toEqual(false);
        expect(rtp_1.marker(fixtures_1.rtpBuffers[1])).toEqual(true);
        expect(rtp_1.marker(fixtures_1.rtpBuffers[2])).toEqual(true);
        expect(rtp_1.payloadType(fixtures_1.rtpBuffers[0])).toEqual(96);
        expect(rtp_1.payloadType(fixtures_1.rtpBuffers[1])).toEqual(96);
        expect(rtp_1.payloadType(fixtures_1.rtpBuffers[2])).toEqual(96);
    });
    it('should expose the payload', () => {
        expect(rtp_1.payload(fixtures_1.rtpBuffers[0])).toEqual(Buffer.from([]));
        expect(rtp_1.payload(fixtures_1.rtpBuffers[1])).toEqual(Buffer.from([1, 2, 3]));
        expect(rtp_1.payload(fixtures_1.rtpBuffers[2])).toEqual(Buffer.from([1, 2, 3]));
        expect(rtp_1.payload(fixtures_1.rtpBuffersWithHeaderExt[0])).toEqual(Buffer.from([1, 2, 3]));
        expect(rtp_1.payload(fixtures_1.rtpBuffersWithHeaderExt[1])).toEqual(Buffer.from([1, 2, 3]));
    });
    it('should expose the extension header', () => {
        expect(rtp_1.extHeader(fixtures_1.rtpBuffers[0])).toEqual(Buffer.from([]));
        expect(rtp_1.extHeader(fixtures_1.rtpBuffers[1])).toEqual(Buffer.from([]));
        expect(rtp_1.extHeader(fixtures_1.rtpBuffers[2])).toEqual(Buffer.from([]));
        expect(rtp_1.extHeader(fixtures_1.rtpBuffersWithHeaderExt[0])).toEqual(Buffer.from([]));
        expect(rtp_1.extHeader(fixtures_1.rtpBuffersWithHeaderExt[1])).toEqual(Buffer.from([1, 2, 0, 1, 1, 2, 3, 4]));
    });
});
//# sourceMappingURL=rtp.test.js.map