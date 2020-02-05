import { bodyOffset, connectionEnded, contentBase, sequence, sessionId, statusCode, sessionTimeout, } from './rtsp';
import { sdpResponse, sdpResponseLive555, setupResponse, teardownResponse, setupResponseNoTimeout, } from './fixtures';
describe('Rtsp', function () {
    describe('sequence', function () {
        it('should return an int', function () {
            expect(sequence(Buffer.from(sdpResponse))).toEqual(3);
            expect(sequence(Buffer.from(setupResponse))).toEqual(5);
        });
    });
    describe('sessionId', function () {
        it('should be a null before SETUP', function () {
            expect(sessionId(Buffer.from(sdpResponse))).toEqual(null);
        });
        it('should be present in a SETUP response', function () {
            expect(sessionId(Buffer.from(setupResponse))).toEqual('Bk48Ak7wjcWaAgRD');
        });
        it('should be present in a TEARDOWN response', function () {
            expect(sessionId(Buffer.from(teardownResponse))).toEqual('ZyHdf8Mn.$epq_8Z');
        });
    });
    describe('sessionTimeout', function () {
        it('should be null before SETUP', function () {
            expect(sessionTimeout(Buffer.from(sdpResponse))).toBeNull();
        });
        it('should be extracted correctly when in a SETUP response', function () {
            expect(sessionTimeout(Buffer.from(setupResponse))).toEqual(60);
        });
        it('should be null when not specified in a SETUP response', function () {
            expect(sessionTimeout(Buffer.from(setupResponseNoTimeout))).toBeNull();
        });
    });
    describe('statusCode', function () {
        it('should return an integer', function () {
            expect(statusCode(Buffer.from(sdpResponseLive555))).toEqual(200);
            expect(statusCode(Buffer.from(teardownResponse))).toEqual(200);
        });
    });
    describe('contentBase', function () {
        it('should return correct contentBase', function () {
            expect(contentBase(Buffer.from(sdpResponse))).toEqual('rtsp://192.168.0.3/axis-media/media.amp/');
        });
        it('should return correct contentBase using live555', function () {
            expect(contentBase(Buffer.from(sdpResponseLive555))).toEqual('rtsp://127.0.0.1:8554/out.svg/');
        });
    });
    describe('connectionEnded', function () {
        it('should be true in a TEARDOWN response', function () {
            expect(connectionEnded(Buffer.from(teardownResponse))).toEqual(true);
        });
        it('should be false otherwise', function () {
            expect(connectionEnded(Buffer.from(setupResponse))).toEqual(false);
        });
    });
    describe('bodyOffset', function () {
        it('should return the lowest index of all possible line breaks', function () {
            var bodyWithLinebreaks = '\r\r<svg>\r\n\r\n</svg>\n\n';
            var buf = Buffer.alloc(setupResponse.length + bodyWithLinebreaks.length);
            setupResponse.split('').map(function (character, index) {
                buf[index] = character.charCodeAt(0);
            });
            bodyWithLinebreaks.split('').map(function (character, index) {
                buf[index + setupResponse.length] = character.charCodeAt(0);
            });
            expect(bodyOffset(buf)).toEqual(setupResponse.length);
        });
    });
});
//# sourceMappingURL=rtsp.test.js.map