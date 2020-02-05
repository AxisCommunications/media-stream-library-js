import { setupResponse, responses, sdpResponseVideoAudioSVG } from './fixtures';
import { RtspSession, RTSP_METHOD } from '.';
import { Writable } from 'stream';
import { MessageType } from '../message';
import { messageFromBuffer } from '../../utils/protocols/sdp';
import { runComponentTests } from '../../utils/validate-component';
var sdp = "v=0\no=- 12566106766544666011 1 IN IP4 192.168.0.90\ns=Session streamed with GStreamer\ni=rtsp-server\nt=0 0\na=tool:GStreamer\na=type:broadcast\na=range:npt=now-\na=control:rtsp://192.168.0.90/axis-media/media.amp?audio=1\nm=video 0 RTP/AVP 96\nc=IN IP4 0.0.0.0\nb=AS:50000\na=rtpmap:96 H264/90000\na=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=blabla=,aO48gA==\na=control:rtsp://192.168.0.90/axis-media/media.amp/stream=0?audio=1\na=framerate:25.000000\na=transform:1.000000,0.000000,0.000000;0.000000,1.000000,0.000000;0.000000,0.000000,1.000000\nm=audio 0 RTP/AVP 0\nc=IN IP4 0.0.0.0\nb=AS:64\na=rtpmap:0 PCMU/8000\na=control:rtsp://192.168.0.90/axis-media/media.amp/stream=1?audio=1\n";
describe('is a valid component', function () {
    var c = new RtspSession({ uri: 'rtsp://whatever/path' });
    runComponentTests(c, 'RTSP Session component');
});
describe('session', function () {
    test('should generate uri if no URI is given', function () {
        var s = new RtspSession({ hostname: 'hostname' });
        expect(s.uri).toEqual('rtsp://hostname/axis-media/media.amp');
    });
    test('should not throw if an URI is given', function () {
        expect(function () { return new RtspSession({ uri: 'myURI' }); }).not.toThrow();
    });
    describe('send', function () {
        test('should throw if no method is given', function () {
            var s = new RtspSession({ uri: 'myURI' });
            expect(function () { return s.send(undefined); }).toThrow();
        });
        test('should emit a message with the correct method', function (done) {
            var s = new RtspSession({ uri: 'rtsp://whatever/path' });
            s.outgoing.once('data', function (msg) {
                expect(msg.method).toEqual(RTSP_METHOD.DESCRIBE);
                done();
            });
            s.send({ method: RTSP_METHOD.DESCRIBE });
        });
        test('should use 1 as first sequence', function (done) {
            var s = new RtspSession({ uri: 'rtsp://whatever/path' });
            s.outgoing.once('data', function (msg) {
                expect(msg.headers.CSeq).toEqual(1);
                done();
            });
            s.send({ method: RTSP_METHOD.DESCRIBE });
        });
        test('should use the supplied URI', function (done) {
            var uri = 'rtsp://whatever/path';
            var s = new RtspSession({ uri: uri });
            s.outgoing.once('data', function (req) {
                expect(req.uri).toEqual(uri);
                done();
            });
            s.send({ method: RTSP_METHOD.DESCRIBE });
        });
        test('should use the supplied headers', function (done) {
            var defaultHeaders = { customheader: 'customVal' };
            var s = new RtspSession({
                uri: 'rtsp://whatever/path',
                defaultHeaders: defaultHeaders,
            });
            s.outgoing.once('data', function (req) {
                expect(req.headers.customheader).toEqual('customVal');
                done();
            });
            s.send({ method: RTSP_METHOD.DESCRIBE });
        });
        test('should not send if incoming is closed', function (done) {
            var s = new RtspSession();
            var w = new Writable();
            w._write = function (msg, enc, next) {
                // consume the msg
                next();
            };
            s.incoming.pipe(w);
            expect(s._outgoingClosed).toEqual(false);
            // close the incoming stream
            s.incoming.push(null);
            // Use setImmediate to ensure the 'on end' callback has fired before
            // we do the test
            setImmediate(function () {
                expect(s._outgoingClosed).toEqual(true);
                done();
            });
        });
    });
    describe('onIncoming', function () {
        test('should get the controlURIs from a SDP message', function (done) {
            var s = new RtspSession({ uri: 'whatever' });
            var expectedControlUri = 'rtsp://192.168.0.90/axis-media/media.amp/stream=0?audio=1';
            var expectedControlUri2 = 'rtsp://192.168.0.90/axis-media/media.amp/stream=1?audio=1';
            s.outgoing.once('data', function (msg) {
                expect(msg.type).toEqual(MessageType.RTSP);
                expect(expectedControlUri).toEqual(msg.uri);
                expect(msg.method).toEqual('SETUP');
                expect(s._callStack[0].uri).toEqual(expectedControlUri2);
                expect(s._callStack[0].method).toEqual('SETUP');
                done();
            });
            s.incoming.write(messageFromBuffer(Buffer.from(sdp)));
        });
        test('should get the session from a Response containing session info', function () {
            var s = new RtspSession({ uri: 'whatever' });
            expect(s._sessionId).toEqual(null);
            expect(s._renewSessionInterval).toBeNull();
            var res = Buffer.from(setupResponse);
            s.incoming.write({ data: res, type: MessageType.RTSP });
            expect(s._sessionId).toEqual('Bk48Ak7wjcWaAgRD');
            expect(s._renewSessionInterval).not.toBeNull();
        });
        test('should emit a Request using SETUP command', function (done) {
            var s = new RtspSession({ uri: 'whatever' });
            s.outgoing.on('data', function (msg) {
                expect(msg.type).toEqual(MessageType.RTSP);
                expect(msg.method).toEqual('SETUP');
                expect(msg.uri).toEqual('rtsp://192.168.0.90/axis-media/media.amp/stream=0?video=1&audio=1&svg=on');
                expect(s._callStack.length).toEqual(2);
                done();
            });
            // s.incoming.write({type: RTSP, data: Buffer.from(sdpResponseVideoAudioSVG)});
            var sdp = Buffer.from(sdpResponseVideoAudioSVG);
            s.incoming.write(messageFromBuffer(sdp));
        });
        test('The SETUP request should contain the Blocksize header by default', function (done) {
            var s = new RtspSession({ uri: 'whatever' });
            s.outgoing.once('data', function (msg) {
                expect(msg.headers.Blocksize).toEqual('64000');
                done();
            });
            var sdp = Buffer.from(sdpResponseVideoAudioSVG);
            s.incoming.write(messageFromBuffer(sdp));
        });
    });
    describe('retry', function () {
        test('should emit a Request with similar props', function (done) {
            var s = new RtspSession({ uri: 'rtsp://whatever/path' });
            s.outgoing.once('data', function () {
                s.outgoing.once('data', function (retry) {
                    expect(RTSP_METHOD.DESCRIBE).toEqual(retry.method);
                    expect(retry.uri).toEqual(s.uri);
                    done();
                });
                s._retry();
            });
            s.send({ method: RTSP_METHOD.DESCRIBE });
        });
        test('should increment the sequence', function (done) {
            var s = new RtspSession({ uri: 'rtsp://whatever/path' });
            s.outgoing.once('data', function (req) {
                s.outgoing.once('data', function (retry) {
                    expect(retry.headers.CSeq).toEqual(req.headers.CSeq + 1);
                    done();
                });
                s._retry();
            });
            s.send({ method: RTSP_METHOD.DESCRIBE });
        });
    });
    describe('play', function () {
        test('should emit 1 OPTIONS request and wait for an answer', function (done) {
            var s = new RtspSession({ uri: 'rtsp://whatever/path' });
            var calls = 0;
            var method;
            s.outgoing.on('data', function (req) {
                calls++;
                method = req.method;
            });
            s.play();
            setTimeout(function () {
                try {
                    expect(calls).toEqual(1);
                    expect(method).toEqual(RTSP_METHOD.OPTIONS);
                    done();
                }
                catch (e) {
                    done(e);
                }
            }, 10);
        });
        test('should emit 4 commands in a given sequence', function (done) {
            var s = new RtspSession({ uri: 'rtsp://whatever/path' });
            var calls = 0;
            var methods = [];
            s.outgoing.on('data', function (req) {
                if (req.type !== MessageType.RTSP) {
                    return;
                }
                methods.push(req.method);
                var rtspResponse = responses[calls++];
                var rtspMessage = {
                    data: Buffer.from(rtspResponse),
                    type: MessageType.RTSP,
                };
                s.incoming.write(rtspMessage); // Give a canned response
                if (req.method === 'DESCRIBE') {
                    var sdpMessage = messageFromBuffer(Buffer.from(rtspResponse));
                    s.incoming.write(sdpMessage);
                }
                if (req.method === 'PLAY') {
                    s.incoming.end();
                }
            });
            s.play();
            s.incoming.on('finish', function () {
                expect(methods.join()).toEqual(['OPTIONS', 'DESCRIBE', 'SETUP', 'PLAY'].join());
                done();
            });
        });
    });
    describe('pause', function () {
        test('should emit 1 PAUSE request', function (done) {
            var s = new RtspSession({ uri: 'rtsp://whatever/path' });
            s.outgoing.once('data', function (req) {
                expect(req.method).toEqual('PAUSE');
                done();
            });
            s.pause();
        });
    });
    describe('stop', function () {
        test('should emit 1 TEARDOWN request', function (done) {
            var s = new RtspSession({ uri: 'rtsp://whatever/path' });
            // Fake that SETUP was issued to trigger an actual TEARDOWN
            s._sessionId = '18315797286303868614';
            s.outgoing.once('data', function (req) {
                expect(req.method).toEqual('TEARDOWN');
                done();
            });
            s.stop();
        });
    });
});
//# sourceMappingURL=index.test.js.map