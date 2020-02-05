"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const message_1 = require("../../components/message");
const sdp_1 = require("./sdp");
const example = Buffer.from(`
v=0
o=- 18315797286303868614 1 IN IP4 127.0.0.1
s=Session streamed with GStreamer
i=rtsp-server
t=0 0
a=tool:GStreamer
a=type:broadcast
a=range:npt=now-
a=control:rtsp://hostname/axis-media/media.amp?audio=1&video=1
m=video 0 RTP/AVP 96
c=IN IP4 0.0.0.0
b=AS:50000
a=rtpmap:96 H264/90000
a=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA==
a=control:rtsp://hostname/axis-media/media.amp/stream=0?audio=1&video=1
a=framerate:25.000000
a=transform:1.000000,0.000000,0.000000;0.000000,0.750000,0.000000;0.000000,0.000000,1.000000
m=audio 0 RTP/AVP 97
c=IN IP4 0.0.0.0
b=AS:32
a=rtpmap:97 MPEG4-GENERIC/16000/1
a=fmtp:97 streamtype=5;profile-level-id=2;mode=AAC-hbr;config=1408;sizeLength=13;indexlength=3;indexdeltalength=3;bitrate=32000
a=control:rtsp://hostname/axis-media/media.amp/stream=1?audio=1&video=1
`);
/* eslint-enable */
describe('Sdp', () => {
    it('should expose correct controlURIs', () => {
        expect(sdp_1.extractURIs(example)).toEqual([
            'rtsp://hostname/axis-media/media.amp/stream=0?audio=1&video=1',
            'rtsp://hostname/axis-media/media.amp/stream=1?audio=1&video=1',
        ]);
    });
    it('should parse to a JS object', () => {
        expect(sdp_1.parse(example)).toEqual({
            session: {
                version: '0',
                origin: {
                    username: '-',
                    sessionId: '18315797286303868614',
                    sessionVersion: '1',
                    netType: 'IN',
                    addrType: 'IP4',
                    unicastAddress: '127.0.0.1',
                },
                sessionName: 'Session streamed with GStreamer',
                sessionInformation: 'rtsp-server',
                time: { startTime: 0, stopTime: 0 },
                tool: 'GStreamer',
                type: 'broadcast',
                range: 'npt=now-',
                control: 'rtsp://hostname/axis-media/media.amp?audio=1&video=1',
            },
            media: [
                {
                    type: 'video',
                    bandwidth: '50000',
                    bwtype: 'AS',
                    connectionData: {
                        addrType: 'IP4',
                        connectionAddress: '0.0.0.0',
                        netType: 'IN',
                    },
                    port: 0,
                    protocol: 'RTP/AVP',
                    fmt: 96,
                    fmtp: {
                        format: '96',
                        parameters: {
                            'packetization-mode': '1',
                            'profile-level-id': '4d0029',
                            'sprop-parameter-sets': 'Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA==',
                        },
                    },
                    rtpmap: {
                        clockrate: 90000,
                        encodingName: 'H264',
                        payloadType: 96,
                    },
                    control: 'rtsp://hostname/axis-media/media.amp/stream=0?audio=1&video=1',
                    framerate: 25,
                    transform: [
                        [1, 0, 0],
                        [0, 0.75, 0],
                        [0, 0, 1],
                    ],
                },
                {
                    type: 'audio',
                    bandwidth: '32',
                    bwtype: 'AS',
                    connectionData: {
                        addrType: 'IP4',
                        connectionAddress: '0.0.0.0',
                        netType: 'IN',
                    },
                    port: 0,
                    protocol: 'RTP/AVP',
                    fmt: 97,
                    fmtp: {
                        parameters: {
                            bitrate: '32000',
                            config: '1408',
                            indexdeltalength: '3',
                            indexlength: '3',
                            mode: 'AAC-hbr',
                            'profile-level-id': '2',
                            sizelength: '13',
                            streamtype: '5',
                        },
                        format: '97',
                    },
                    rtpmap: {
                        clockrate: 16000,
                        encodingName: 'MPEG4-GENERIC',
                        encodingParameters: '1',
                        payloadType: 97,
                    },
                    control: 'rtsp://hostname/axis-media/media.amp/stream=1?audio=1&video=1',
                },
            ],
        });
    });
    it('messageFromBuffer should produce a message with the correct structure', () => {
        const message = sdp_1.messageFromBuffer(example);
        expect(Object.keys(message)).toEqual(['type', 'data', 'sdp']);
        expect(message.data).toBe(example);
        expect(message.type).toEqual(message_1.MessageType.SDP);
    });
});
//# sourceMappingURL=sdp.test.js.map