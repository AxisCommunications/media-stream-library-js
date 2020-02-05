import { MessageType } from '../../components/message';
import { extractURIs, messageFromBuffer, parse } from './sdp';
var example = Buffer.from("\nv=0\no=- 18315797286303868614 1 IN IP4 127.0.0.1\ns=Session streamed with GStreamer\ni=rtsp-server\nt=0 0\na=tool:GStreamer\na=type:broadcast\na=range:npt=now-\na=control:rtsp://hostname/axis-media/media.amp?audio=1&video=1\nm=video 0 RTP/AVP 96\nc=IN IP4 0.0.0.0\nb=AS:50000\na=rtpmap:96 H264/90000\na=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA==\na=control:rtsp://hostname/axis-media/media.amp/stream=0?audio=1&video=1\na=framerate:25.000000\na=transform:1.000000,0.000000,0.000000;0.000000,0.750000,0.000000;0.000000,0.000000,1.000000\nm=audio 0 RTP/AVP 97\nc=IN IP4 0.0.0.0\nb=AS:32\na=rtpmap:97 MPEG4-GENERIC/16000/1\na=fmtp:97 streamtype=5;profile-level-id=2;mode=AAC-hbr;config=1408;sizeLength=13;indexlength=3;indexdeltalength=3;bitrate=32000\na=control:rtsp://hostname/axis-media/media.amp/stream=1?audio=1&video=1\n");
/* eslint-enable */
describe('Sdp', function () {
    it('should expose correct controlURIs', function () {
        expect(extractURIs(example)).toEqual([
            'rtsp://hostname/axis-media/media.amp/stream=0?audio=1&video=1',
            'rtsp://hostname/axis-media/media.amp/stream=1?audio=1&video=1',
        ]);
    });
    it('should parse to a JS object', function () {
        expect(parse(example)).toEqual({
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
    it('messageFromBuffer should produce a message with the correct structure', function () {
        var message = messageFromBuffer(example);
        expect(Object.keys(message)).toEqual(['type', 'data', 'sdp']);
        expect(message.data).toBe(example);
        expect(message.type).toEqual(MessageType.SDP);
    });
});
//# sourceMappingURL=sdp.test.js.map