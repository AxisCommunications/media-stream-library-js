"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = require("./parser");
const fixtures_1 = require("./fixtures");
const message_1 = require("../message");
describe('Parsing of interleaved data', () => {
    let parser;
    let messages = [];
    beforeEach(() => {
        parser = new parser_1.Parser();
        messages = [];
    });
    test('can append buffers', () => {
        expect(() => {
            parser.parse(Buffer.alloc(0));
        }).not.toThrow();
    });
    describe('error handling', () => {
        test('should handle a [36, 0, x] buffer correctly', () => {
            expect(() => {
                messages = parser.parse(Buffer.from([36, 0, 5]));
            }).not.toThrow();
            expect(messages.length).toBe(0);
            expect(parser._length).toBe(3);
        });
        test('should handle a [36] buffer correctly', () => {
            expect(() => {
                messages = parser.parse(Buffer.from([36]));
            }).not.toThrow();
            expect(messages.length).toBe(0);
            expect(parser._length).toBe(1);
        });
        test('should throw an error when coming across an unknown buffer', () => {
            expect(() => parser.parse(Buffer.from([1, 2, 3]))).toThrow();
        });
    });
    describe('1 buffer = 1 rtp package', () => {
        let buffer1;
        beforeAll(() => {
            buffer1 = Buffer.alloc(fixtures_1.frames.onePointZero.length);
            fixtures_1.frames.onePointZero.map((byte, index) => {
                buffer1[index] = byte;
            });
        });
        test('extracts one message', () => {
            messages = parser.parse(buffer1);
            expect(messages.length).toBe(1);
        });
        test('extracts message with correct data', () => {
            messages = parser.parse(buffer1);
            const msg = messages[0];
            expect(Buffer.concat([msg.data])).toEqual(buffer1.slice(4));
            expect(msg.channel).toEqual(0);
        });
        test('the buffer should be empty afterwards (no messages data buffered)', () => {
            messages = parser.parse(buffer1);
            expect(parser._length).toEqual(0);
        });
    });
    describe('1 buffer = 1,5 rtp package', () => {
        let buffer15;
        beforeAll(() => {
            buffer15 = Buffer.alloc(fixtures_1.frames.onePointFive.length);
            fixtures_1.frames.onePointFive.map((byte, index) => {
                buffer15[index] = byte;
            });
        });
        test('extracts one message', () => {
            messages = parser.parse(buffer15);
            expect(messages.length).toBe(1);
        });
        test('extracts the full rtp frame', () => {
            messages = parser.parse(buffer15);
            const msg = messages[0];
            const emittedBuffer = msg.data;
            expect(msg.type).toEqual(message_1.MessageType.RTP);
            expect(Buffer.concat([emittedBuffer])).toEqual(buffer15.slice(4, 4 + emittedBuffer.length));
        });
        test('the buffer should not be empty afterwards (half a frame messages)', () => {
            messages = parser.parse(buffer15);
            const emittedBuffer = messages[0].data;
            expect(parser._chunks[0]).toEqual(buffer15.slice(4 + emittedBuffer.length));
        });
    });
    describe('2 buffers = 1,5 +0,5 rtp package', () => {
        let buffer15;
        let buffer05;
        beforeAll(() => {
            buffer15 = Buffer.alloc(fixtures_1.frames.onePointFive.length);
            fixtures_1.frames.onePointFive.map((byte, index) => {
                buffer15[index] = byte;
            });
            buffer05 = Buffer.alloc(fixtures_1.frames.zeroPointFive.length);
            fixtures_1.frames.zeroPointFive.map((byte, index) => {
                buffer05[index] = byte;
            });
        });
        test('extracts two messages', () => {
            messages = parser.parse(buffer15);
            expect(messages.length).toBe(1);
            expect(parser._length).toBeGreaterThan(0);
            messages = parser.parse(buffer05);
            expect(messages.length).toBe(1);
        });
        test('the buffer should be empty afterwards', () => {
            messages = parser.parse(buffer15);
            messages = parser.parse(buffer05);
            expect(parser._length).toBe(0);
        });
    });
    describe('RTSP package', () => {
        let RtspBuffer;
        beforeAll(() => {
            RtspBuffer = Buffer.alloc(fixtures_1.setupResponse.length);
            fixtures_1.setupResponse.split('').map((character, index) => {
                RtspBuffer[index] = character.charCodeAt(0);
            });
        });
        test('extracts the RTSP buffer', () => {
            messages = parser.parse(RtspBuffer);
            expect(messages.length).toBe(1);
            const msg = messages[0];
            expect(msg.type).toEqual(message_1.MessageType.RTSP);
            expect(msg.data).toEqual(Buffer.from(fixtures_1.setupResponse));
        });
        test('the buffer should be empty afterwards (no messages data buffered)', () => {
            messages = parser.parse(RtspBuffer);
            expect(parser._length).toEqual(0);
        });
        test('should detect RTP data in same buffer as RTSP', () => {
            messages = parser.parse(fixtures_1.rtspWithTrailingRtp);
            expect(parser._length).toEqual(4);
        });
        test('should find RTSP, RTP and RTCP packages in the same buffer', () => {
            messages = parser.parse(fixtures_1.rtspRtpRtcpCombined);
            expect(messages.length).toBe(4);
            expect(messages[0].type).toEqual(message_1.MessageType.RTSP);
            expect(messages[1].type).toEqual(message_1.MessageType.RTP);
            expect(messages[1].channel).toEqual(0);
            expect(messages[2].type).toEqual(message_1.MessageType.RTCP);
            expect(messages[2].channel).toEqual(1);
            expect(messages[3].type).toEqual(message_1.MessageType.RTCP);
            expect(messages[3].channel).toEqual(1);
        });
    });
    describe('SDP data', () => {
        let sdpBuffer;
        beforeAll(() => {
            sdpBuffer = Buffer.from(fixtures_1.sdpResponse);
        });
        test('should extract twice, once with the full RTSP and once with the SDP data', () => {
            messages = parser.parse(sdpBuffer);
            expect(messages.length).toBe(2);
            expect(messages[0].type).toEqual(message_1.MessageType.RTSP);
            expect(messages[1].type).toEqual(message_1.MessageType.SDP);
            expect(messages[0].data).toEqual(sdpBuffer);
            const msg = messages[1];
            const b = msg.data;
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
        test('should handle segmented RTSP/SDP', () => {
            const segmentedRTSP = fixtures_1.sdpResponse.split(/(?<=\r\n\r\n)/g);
            const RTSPBuffer = Buffer.from(segmentedRTSP[0]);
            const SDPBuffer = Buffer.from(segmentedRTSP[1]);
            messages = parser.parse(RTSPBuffer);
            expect(messages.length).toBe(0);
            messages = parser.parse(SDPBuffer);
            expect(messages.length).toBe(2);
        });
    });
});
//# sourceMappingURL=parser.test.js.map