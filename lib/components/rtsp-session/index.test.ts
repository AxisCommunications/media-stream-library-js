import { setupResponse, responses, sdpResponseVideoAudioSVG } from './fixtures'
import { RtspSession, RTSP_METHOD } from '.'
import { Writable } from 'stream'
import { MessageType } from '../message'
import { messageFromBuffer } from '../../utils/protocols/sdp'
import { runComponentTests } from '../../utils/validate-component'

const sdp = `v=0
o=- 12566106766544666011 1 IN IP4 192.168.0.90
s=Session streamed with GStreamer
i=rtsp-server
t=0 0
a=tool:GStreamer
a=type:broadcast
a=range:npt=now-
a=control:rtsp://192.168.0.90/axis-media/media.amp?audio=1
m=video 0 RTP/AVP 96
c=IN IP4 0.0.0.0
b=AS:50000
a=rtpmap:96 H264/90000
a=fmtp:96 packetization-mode=1;profile-level-id=4d0029;sprop-parameter-sets=blabla=,aO48gA==
a=control:rtsp://192.168.0.90/axis-media/media.amp/stream=0?audio=1
a=framerate:25.000000
a=transform:1.000000,0.000000,0.000000;0.000000,1.000000,0.000000;0.000000,0.000000,1.000000
m=audio 0 RTP/AVP 0
c=IN IP4 0.0.0.0
b=AS:64
a=rtpmap:0 PCMU/8000
a=control:rtsp://192.168.0.90/axis-media/media.amp/stream=1?audio=1
`

describe('is a valid component', () => {
  const c = new RtspSession({ uri: 'rtsp://whatever/path' })
  runComponentTests(c, 'RTSP Session component')
})

describe('session', () => {
  test('should generate uri if no URI is given', () => {
    const s = new RtspSession({ hostname: 'hostname' })
    expect(s.uri).toEqual('rtsp://hostname/axis-media/media.amp')
  })

  test('should not throw if an URI is given', () => {
    expect(() => new RtspSession({ uri: 'myURI' })).not.toThrow()
  })

  describe('send', () => {
    test('should throw if no method is given', () => {
      const s = new RtspSession({ uri: 'myURI' })
      expect(() => s.send(undefined as any)).toThrow()
    })

    test('should emit a message with the correct method', (done) => {
      const s = new RtspSession({ uri: 'rtsp://whatever/path' })
      s.outgoing.once('data', (msg) => {
        expect(msg.method).toEqual(RTSP_METHOD.DESCRIBE)
        done()
      })
      s.send({ method: RTSP_METHOD.DESCRIBE })
    })

    test('should use 1 as first sequence', (done) => {
      const s = new RtspSession({ uri: 'rtsp://whatever/path' })
      s.outgoing.once('data', (msg) => {
        expect(msg.headers.CSeq).toEqual(1)
        done()
      })
      s.send({ method: RTSP_METHOD.DESCRIBE })
    })

    test('should use the supplied URI', (done) => {
      const uri = 'rtsp://whatever/path'
      const s = new RtspSession({ uri })
      s.outgoing.once('data', (req) => {
        expect(req.uri).toEqual(uri)
        done()
      })
      s.send({ method: RTSP_METHOD.DESCRIBE })
    })

    test('should use the supplied headers', (done) => {
      const defaultHeaders = { customheader: 'customVal' }
      const s = new RtspSession({
        uri: 'rtsp://whatever/path',
        defaultHeaders,
      })
      s.outgoing.once('data', (req) => {
        expect(req.headers.customheader).toEqual('customVal')
        done()
      })
      s.send({ method: RTSP_METHOD.DESCRIBE })
    })

    test('should not send if incoming is closed', (done) => {
      const s = new RtspSession()
      const w = new Writable()
      w._write = function (msg, enc, next) {
        // consume the msg
        next()
      }
      s.incoming.pipe(w)
      expect((s as any)._outgoingClosed).toEqual(false)
      // close the incoming stream
      s.incoming.push(null)
      // Use setImmediate to ensure the 'on end' callback has fired before
      // we do the test
      setImmediate(() => {
        expect((s as any)._outgoingClosed).toEqual(true)
        done()
      })
    })
  })

  describe('onIncoming', () => {
    test('should get the controlURIs from a SDP message', (done) => {
      const s = new RtspSession({ uri: 'whatever' })
      const expectedControlUri =
        'rtsp://192.168.0.90/axis-media/media.amp/stream=0?audio=1'
      const expectedControlUri2 =
        'rtsp://192.168.0.90/axis-media/media.amp/stream=1?audio=1'
      s.outgoing.once('data', (msg) => {
        expect(msg.type).toEqual(MessageType.RTSP)
        expect(expectedControlUri).toEqual(msg.uri)
        expect(msg.method).toEqual('SETUP')
        expect((s as any)._callStack[0].uri).toEqual(expectedControlUri2)
        expect((s as any)._callStack[0].method).toEqual('SETUP')
        done()
      })
      s.incoming.write(messageFromBuffer(Buffer.from(sdp)))
    })

    test('should get the session from a Response containing session info', () => {
      const s = new RtspSession({ uri: 'whatever' })
      expect((s as any)._sessionId).toEqual(null)
      expect((s as any)._renewSessionInterval).toBeNull()
      const res = Buffer.from(setupResponse)
      s.incoming.write({ data: res, type: MessageType.RTSP })
      expect((s as any)._sessionId).toEqual('Bk48Ak7wjcWaAgRD')
      expect((s as any)._renewSessionInterval).not.toBeNull()
    })

    test('should emit a Request using SETUP command', (done) => {
      const s = new RtspSession({ uri: 'whatever' })
      s.outgoing.on('data', (msg) => {
        expect(msg.type).toEqual(MessageType.RTSP)
        expect(msg.method).toEqual('SETUP')
        expect(msg.uri).toEqual(
          'rtsp://192.168.0.90/axis-media/media.amp/stream=0?video=1&audio=1&svg=on',
        )
        expect((s as any)._callStack.length).toEqual(2)
        done()
      })
      // s.incoming.write({type: RTSP, data: Buffer.from(sdpResponseVideoAudioSVG)});
      const sdp = Buffer.from(sdpResponseVideoAudioSVG)
      s.incoming.write(messageFromBuffer(sdp))
    })

    test('The SETUP request should contain the Blocksize header by default', (done) => {
      const s = new RtspSession({ uri: 'whatever' })
      s.outgoing.once('data', (msg) => {
        expect(msg.headers.Blocksize).toEqual('64000')
        done()
      })
      const sdp = Buffer.from(sdpResponseVideoAudioSVG)
      s.incoming.write(messageFromBuffer(sdp))
    })
  })
  describe('retry', () => {
    test('should emit a Request with similar props', (done) => {
      const s = new RtspSession({ uri: 'rtsp://whatever/path' }) as any
      s.outgoing.once('data', () => {
        s.outgoing.once('data', (retry: any) => {
          expect(RTSP_METHOD.DESCRIBE).toEqual(retry.method)
          expect(retry.uri).toEqual(s.uri)
          done()
        })
        s._retry()
      })
      s.send({ method: RTSP_METHOD.DESCRIBE })
    })

    test('should increment the sequence', (done) => {
      const s = new RtspSession({ uri: 'rtsp://whatever/path' }) as any
      s.outgoing.once('data', (req: any) => {
        s.outgoing.once('data', (retry: any) => {
          expect(retry.headers.CSeq).toEqual(req.headers.CSeq + 1)
          done()
        })
        s._retry()
      })
      s.send({ method: RTSP_METHOD.DESCRIBE })
    })
  })

  describe('play', () => {
    test('should emit 1 OPTIONS request and wait for an answer', (done) => {
      const s = new RtspSession({ uri: 'rtsp://whatever/path' })
      let calls = 0
      let method: RTSP_METHOD
      s.outgoing.on('data', (req) => {
        calls++
        method = req.method
      })
      s.play()
      setTimeout(() => {
        try {
          expect(calls).toEqual(1)
          expect(method).toEqual(RTSP_METHOD.OPTIONS)
          done()
        } catch (e) {
          done(e)
        }
      }, 10)
    })

    test('should emit 4 commands in a given sequence', (done) => {
      const s = new RtspSession({ uri: 'rtsp://whatever/path' })
      let calls = 0
      const methods: RTSP_METHOD[] = []
      s.outgoing.on('data', (req) => {
        if (req.type !== MessageType.RTSP) {
          return
        }
        methods.push(req.method)
        const rtspResponse = responses[calls++]
        const rtspMessage = {
          data: Buffer.from(rtspResponse),
          type: MessageType.RTSP,
        }
        s.incoming.write(rtspMessage) // Give a canned response
        if (req.method === 'DESCRIBE') {
          const sdpMessage = messageFromBuffer(Buffer.from(rtspResponse))
          s.incoming.write(sdpMessage)
        }
        if (req.method === 'PLAY') {
          s.incoming.end()
        }
      })
      s.play()
      s.incoming.on('finish', () => {
        expect(methods.join()).toEqual(
          ['OPTIONS', 'DESCRIBE', 'SETUP', 'PLAY'].join(),
        )
        done()
      })
    })
  })

  describe('pause', () => {
    test('should emit 1 PAUSE request', (done) => {
      const s = new RtspSession({ uri: 'rtsp://whatever/path' })
      s.outgoing.once('data', (req) => {
        expect(req.method).toEqual('PAUSE')
        done()
      })
      s.pause()
    })
  })

  describe('stop', () => {
    test('should emit 1 TEARDOWN request', (done) => {
      const s = new RtspSession({ uri: 'rtsp://whatever/path' }) as any
      // Fake that SETUP was issued to trigger an actual TEARDOWN
      s._sessionId = '18315797286303868614'
      s.outgoing.once('data', (req: any) => {
        expect(req.method).toEqual('TEARDOWN')
        done()
      })
      s.stop()
    })
  })
})
