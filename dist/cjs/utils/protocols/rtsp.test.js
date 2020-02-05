"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rtsp_1 = require("./rtsp");
const fixtures_1 = require("./fixtures");
describe('Rtsp', () => {
    describe('sequence', () => {
        it('should return an int', () => {
            expect(rtsp_1.sequence(Buffer.from(fixtures_1.sdpResponse))).toEqual(3);
            expect(rtsp_1.sequence(Buffer.from(fixtures_1.setupResponse))).toEqual(5);
        });
    });
    describe('sessionId', () => {
        it('should be a null before SETUP', () => {
            expect(rtsp_1.sessionId(Buffer.from(fixtures_1.sdpResponse))).toEqual(null);
        });
        it('should be present in a SETUP response', () => {
            expect(rtsp_1.sessionId(Buffer.from(fixtures_1.setupResponse))).toEqual('Bk48Ak7wjcWaAgRD');
        });
        it('should be present in a TEARDOWN response', () => {
            expect(rtsp_1.sessionId(Buffer.from(fixtures_1.teardownResponse))).toEqual('ZyHdf8Mn.$epq_8Z');
        });
    });
    describe('sessionTimeout', () => {
        it('should be null before SETUP', () => {
            expect(rtsp_1.sessionTimeout(Buffer.from(fixtures_1.sdpResponse))).toBeNull();
        });
        it('should be extracted correctly when in a SETUP response', () => {
            expect(rtsp_1.sessionTimeout(Buffer.from(fixtures_1.setupResponse))).toEqual(60);
        });
        it('should be null when not specified in a SETUP response', () => {
            expect(rtsp_1.sessionTimeout(Buffer.from(fixtures_1.setupResponseNoTimeout))).toBeNull();
        });
    });
    describe('statusCode', () => {
        it('should return an integer', () => {
            expect(rtsp_1.statusCode(Buffer.from(fixtures_1.sdpResponseLive555))).toEqual(200);
            expect(rtsp_1.statusCode(Buffer.from(fixtures_1.teardownResponse))).toEqual(200);
        });
    });
    describe('contentBase', () => {
        it('should return correct contentBase', () => {
            expect(rtsp_1.contentBase(Buffer.from(fixtures_1.sdpResponse))).toEqual('rtsp://192.168.0.3/axis-media/media.amp/');
        });
        it('should return correct contentBase using live555', () => {
            expect(rtsp_1.contentBase(Buffer.from(fixtures_1.sdpResponseLive555))).toEqual('rtsp://127.0.0.1:8554/out.svg/');
        });
    });
    describe('connectionEnded', () => {
        it('should be true in a TEARDOWN response', () => {
            expect(rtsp_1.connectionEnded(Buffer.from(fixtures_1.teardownResponse))).toEqual(true);
        });
        it('should be false otherwise', () => {
            expect(rtsp_1.connectionEnded(Buffer.from(fixtures_1.setupResponse))).toEqual(false);
        });
    });
    describe('bodyOffset', () => {
        it('should return the lowest index of all possible line breaks', () => {
            const bodyWithLinebreaks = '\r\r<svg>\r\n\r\n</svg>\n\n';
            const buf = Buffer.alloc(fixtures_1.setupResponse.length + bodyWithLinebreaks.length);
            fixtures_1.setupResponse.split('').map((character, index) => {
                buf[index] = character.charCodeAt(0);
            });
            bodyWithLinebreaks.split('').map((character, index) => {
                buf[index + fixtures_1.setupResponse.length] = character.charCodeAt(0);
            });
            expect(rtsp_1.bodyOffset(buf)).toEqual(fixtures_1.setupResponse.length);
        });
    });
});
//# sourceMappingURL=rtsp.test.js.map