import { Parser } from './parser';
import { frames, setupResponse, rtspRtpRtcpCombined, rtspWithTrailingRtp, sdpResponse, } from './fixtures';
import { MessageType } from '../message';
describe('Parsing of interleaved data', function () {
    var parser;
    var messages = [];
    beforeEach(function () {
        parser = new Parser();
        messages = [];
    });
    test('can append buffers', function () {
        expect(function () {
            parser.parse(Buffer.alloc(0));
        }).not.toThrow();
    });
    describe('error handling', function () {
        test('should handle a [36, 0, x] buffer correctly', function () {
            expect(function () {
                messages = parser.parse(Buffer.from([36, 0, 5]));
            }).not.toThrow();
            expect(messages.length).toBe(0);
            expect(parser._length).toBe(3);
        });
        test('should handle a [36] buffer correctly', function () {
            expect(function () {
                messages = parser.parse(Buffer.from([36]));
            }).not.toThrow();
            expect(messages.length).toBe(0);
            expect(parser._length).toBe(1);
        });
        test('should throw an error when coming across an unknown buffer', function () {
            expect(function () { return parser.parse(Buffer.from([1, 2, 3])); }).toThrow();
        });
    });
    describe('1 buffer = 1 rtp package', function () {
        var buffer1;
        beforeAll(function () {
            buffer1 = Buffer.alloc(frames.onePointZero.length);
            frames.onePointZero.map(function (byte, index) {
                buffer1[index] = byte;
            });
        });
        test('extracts one message', function () {
            messages = parser.parse(buffer1);
            expect(messages.length).toBe(1);
        });
        test('extracts message with correct data', function () {
            messages = parser.parse(buffer1);
            var msg = messages[0];
            expect(Buffer.concat([msg.data])).toEqual(buffer1.slice(4));
            expect(msg.channel).toEqual(0);
        });
        test('the buffer should be empty afterwards (no messages data buffered)', function () {
            messages = parser.parse(buffer1);
            expect(parser._length).toEqual(0);
        });
    });
    describe('1 buffer = 1,5 rtp package', function () {
        var buffer15;
        beforeAll(function () {
            buffer15 = Buffer.alloc(frames.onePointFive.length);
            frames.onePointFive.map(function (byte, index) {
                buffer15[index] = byte;
            });
        });
        test('extracts one message', function () {
            messages = parser.parse(buffer15);
            expect(messages.length).toBe(1);
        });
        test('extracts the full rtp frame', function () {
            messages = parser.parse(buffer15);
            var msg = messages[0];
            var emittedBuffer = msg.data;
            expect(msg.type).toEqual(MessageType.RTP);
            expect(Buffer.concat([emittedBuffer])).toEqual(buffer15.slice(4, 4 + emittedBuffer.length));
        });
        test('the buffer should not be empty afterwards (half a frame messages)', function () {
            messages = parser.parse(buffer15);
            var emittedBuffer = messages[0].data;
            expect(parser._chunks[0]).toEqual(buffer15.slice(4 + emittedBuffer.length));
        });
    });
    describe('2 buffers = 1,5 +0,5 rtp package', function () {
        var buffer15;
        var buffer05;
        beforeAll(function () {
            buffer15 = Buffer.alloc(frames.onePointFive.length);
            frames.onePointFive.map(function (byte, index) {
                buffer15[index] = byte;
            });
            buffer05 = Buffer.alloc(frames.zeroPointFive.length);
            frames.zeroPointFive.map(function (byte, index) {
                buffer05[index] = byte;
            });
        });
        test('extracts two messages', function () {
            messages = parser.parse(buffer15);
            expect(messages.length).toBe(1);
            expect(parser._length).toBeGreaterThan(0);
            messages = parser.parse(buffer05);
            expect(messages.length).toBe(1);
        });
        test('the buffer should be empty afterwards', function () {
            messages = parser.parse(buffer15);
            messages = parser.parse(buffer05);
            expect(parser._length).toBe(0);
        });
    });
    describe('RTSP package', function () {
        var RtspBuffer;
        beforeAll(function () {
            RtspBuffer = Buffer.alloc(setupResponse.length);
            setupResponse.split('').map(function (character, index) {
                RtspBuffer[index] = character.charCodeAt(0);
            });
        });
        test('extracts the RTSP buffer', function () {
            messages = parser.parse(RtspBuffer);
            expect(messages.length).toBe(1);
            var msg = messages[0];
            expect(msg.type).toEqual(MessageType.RTSP);
            expect(msg.data).toEqual(Buffer.from(setupResponse));
        });
        test('the buffer should be empty afterwards (no messages data buffered)', function () {
            messages = parser.parse(RtspBuffer);
            expect(parser._length).toEqual(0);
        });
        test('should detect RTP data in same buffer as RTSP', function () {
            messages = parser.parse(rtspWithTrailingRtp);
            expect(parser._length).toEqual(4);
        });
        test('should find RTSP, RTP and RTCP packages in the same buffer', function () {
            messages = parser.parse(rtspRtpRtcpCombined);
            expect(messages.length).toBe(4);
            expect(messages[0].type).toEqual(MessageType.RTSP);
            expect(messages[1].type).toEqual(MessageType.RTP);
            expect(messages[1].channel).toEqual(0);
            expect(messages[2].type).toEqual(MessageType.RTCP);
            expect(messages[2].channel).toEqual(1);
            expect(messages[3].type).toEqual(MessageType.RTCP);
            expect(messages[3].channel).toEqual(1);
        });
    });
    describe('SDP data', function () {
        var sdpBuffer;
        beforeAll(function () {
            sdpBuffer = Buffer.from(sdpResponse);
        });
        test('should extract twice, once with the full RTSP and once with the SDP data', function () {
            messages = parser.parse(sdpBuffer);
            expect(messages.length).toBe(2);
            expect(messages[0].type).toEqual(MessageType.RTSP);
            expect(messages[1].type).toEqual(MessageType.SDP);
            expect(messages[0].data).toEqual(sdpBuffer);
            var msg = messages[1];
            var b = msg.data;
            // Should contain the full SDP data
            expect(b.length).toEqual(623);
            expect(msg.sdp).toBeInstanceOf(Object);
            expect(msg.sdp.session).toBeInstanceOf(Object);
            expect(msg.sdp.media).toBeInstanceOf(Array);
            // Should start correctly
            expect(b.toString('ascii', 0, 3)).toEqual('v=0');
            // Should end correctly
            expect(b.toString('ascii', b.length - 3)).toEqual('0\r\n');
        });
        test('should handle segmented RTSP/SDP', function () {
            var segmentedRTSP = sdpResponse.split(/(?<=\r\n\r\n)/g);
            var RTSPBuffer = Buffer.from(segmentedRTSP[0]);
            var SDPBuffer = Buffer.from(segmentedRTSP[1]);
            messages = parser.parse(RTSPBuffer);
            expect(messages.length).toBe(0);
            messages = parser.parse(SDPBuffer);
            expect(messages.length).toBe(2);
        });
    });
});
//# sourceMappingURL=parser.test.js.map