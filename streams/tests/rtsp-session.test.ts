import * as assert from 'uvu/assert'

import { Writable } from 'stream'
import { MessageType } from 'components/message'
import { RTSP_METHOD, RtspSession } from 'components/rtsp-session'
import { messageFromBuffer } from 'utils/protocols/sdp'

import {
  responses,
  sdpResponseVideoAudioSVG,
  setupResponse,
} from './rtsp-session.fixtures'
import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

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

describe('rtsp-session component', (test) => {
  const c = new RtspSession({ uri: 'rtsp://whatever/path' })

  runComponentTests(c, 'rtsp-session', test)

  test('should generate uri if no URI is given', () => {
    const s = new RtspSession({ hostname: 'hostname' })
    assert.is(s.uri, 'rtsp://hostname/axis-media/media.amp')
  })
})

describe('rtsp-session send method', (test) => {
  test('send should throw if no method is given', () => {
    const s = new RtspSession({ uri: 'myURI' })
    assert.throws(() => s.send(undefined as never))
  })

  test('should emit a message with the correct method', async (ctx) => {
    const s = new RtspSession({ uri: 'rtsp://whatever/path' })
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    s.outgoing.once('data', (msg) => {
      assert.is(msg.method, RTSP_METHOD.DESCRIBE)
      ctx.resolve()
    })
    s.send({ method: RTSP_METHOD.DESCRIBE })
    await done
  })

  test('should use 1 as first sequence', async (ctx) => {
    const s = new RtspSession({ uri: 'rtsp://whatever/path' })
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    s.outgoing.once('data', (msg) => {
      assert.is(msg.headers.CSeq, 1)
      ctx.resolve()
    })
    s.send({ method: RTSP_METHOD.DESCRIBE })
    await done
  })

  test('should use the supplied URI', async (ctx) => {
    const uri = 'rtsp://whatever/path'
    const s = new RtspSession({ uri })
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    s.outgoing.once('data', (req) => {
      assert.is(req.uri, uri)
      ctx.resolve()
    })
    s.send({ method: RTSP_METHOD.DESCRIBE })
    await done
  })

  test('should use the supplied headers', async (ctx) => {
    const defaultHeaders = { customheader: 'customVal' }
    const s = new RtspSession({
      uri: 'rtsp://whatever/path',
      defaultHeaders,
    })
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    s.outgoing.once('data', (req) => {
      assert.is(req.headers.customheader, 'customVal')
      ctx.resolve()
    })
    s.send({ method: RTSP_METHOD.DESCRIBE })
    await done
  })

  test('should not send if incoming is closed', async (ctx) => {
    const s = new RtspSession()
    const w = new Writable()
    w._write = function (_msg, _enc, next) {
      // consume the msg
      next()
    }
    s.incoming.pipe(w)

    assert.is((s as any)._outgoingClosed, false)
    // close the incoming stream
    s.incoming.push(null)
    // Use setTimeout to ensure the 'on end' callback has fired before
    // we do the test
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    setTimeout(() => {
      assert.is((s as any)._outgoingClosed, true)
      ctx.resolve()
    }, 0)
    await done
  })
})

describe('rtsp-sessiont onIncoming method', (test) => {
  test('should get the controlURIs from a SDP message', async (ctx) => {
    const s = new RtspSession({ uri: 'whatever' })
    const expectedControlUri =
      'rtsp://192.168.0.90/axis-media/media.amp/stream=0?audio=1'
    const expectedControlUri2 =
      'rtsp://192.168.0.90/axis-media/media.amp/stream=1?audio=1'
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    s.outgoing.once('data', (msg) => {
      assert.is(msg.type, MessageType.RTSP)
      assert.is(expectedControlUri, msg.uri)
      assert.is(msg.method, 'SETUP')

      assert.is((s as any)._callStack[0].uri, expectedControlUri2)

      assert.is((s as any)._callStack[0].method, 'SETUP')
      ctx.resolve()
    })
    s.incoming.write(messageFromBuffer(Buffer.from(sdp)))
    await done
  })

  test('should get the session from a Response containing session info', () => {
    const s = new RtspSession({ uri: 'whatever' })

    assert.is((s as any)._sessionId, null)

    assert.is((s as any)._renewSessionInterval, null)
    const res = Buffer.from(setupResponse)
    s.incoming.write({ data: res, type: MessageType.RTSP })

    assert.is((s as any)._sessionId, 'Bk48Ak7wjcWaAgRD')

    assert.is.not((s as any)._renewSessionInterval, null)
    s.stop()
  })

  test('should emit a Request using SETUP command', async (ctx) => {
    const s = new RtspSession({ uri: 'whatever' })
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    s.outgoing.on('data', (msg) => {
      assert.is(msg.type, MessageType.RTSP)
      assert.is(msg.method, 'SETUP')
      assert.is(
        msg.uri,
        'rtsp://192.168.0.90/axis-media/media.amp/stream=0?video=1&audio=1&svg=on'
      )

      assert.is((s as any)._callStack.length, 2)
      ctx.resolve()
    })
    s.incoming.write(messageFromBuffer(Buffer.from(sdpResponseVideoAudioSVG)))
    await done
  })

  test('The SETUP request should contain the Blocksize header by default', async (ctx) => {
    const s = new RtspSession({ uri: 'whatever' })
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    s.outgoing.once('data', (msg) => {
      assert.is(msg.headers.Blocksize, '64000')
      ctx.resolve()
    })
    s.incoming.write(messageFromBuffer(Buffer.from(sdpResponseVideoAudioSVG)))
    await done
  })
})

describe('rtsp-session retry', (test) => {
  test('should emit a Request with similar props', async (ctx) => {
    const s = new RtspSession({ uri: 'rtsp://whatever/path' }) as any
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    s.outgoing.once('data', () => {
      s.outgoing.once('data', (retry: any) => {
        assert.is(RTSP_METHOD.DESCRIBE, retry.method)
        assert.is(retry.uri, s.uri)
        ctx.resolve()
      })
      s.retry()
    })
    s.send({ method: RTSP_METHOD.DESCRIBE })
    await done
  })

  test('should increment the sequence', async (ctx) => {
    const s = new RtspSession({ uri: 'rtsp://whatever/path' }) as any
    const done = new Promise((resolve) => (ctx.resolve = resolve))

    s.outgoing.once('data', (req: any) => {
      s.outgoing.once('data', (retry: any) => {
        assert.is(retry.headers.CSeq, (req.headers.CSeq as number) + 1)
        ctx.resolve()
      })
      s.retry()
    })
    s.send({ method: RTSP_METHOD.DESCRIBE })
    await done
  })
})

describe('rtsp-session play', (test) => {
  test('should emit 1 OPTIONS request and wait for an answer', async (ctx) => {
    const s = new RtspSession({ uri: 'rtsp://whatever/path' })
    let calls = 0
    let method: RTSP_METHOD
    s.outgoing.on('data', (req) => {
      calls++
      method = req.method
    })
    s.play()
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    setTimeout(() => {
      try {
        assert.is(calls, 1)
        assert.is(method, RTSP_METHOD.OPTIONS)
        ctx.resolve()
      } catch (e) {
        ctx.resolve(e)
      }
    }, 10)
    await done
  })

  test('should emit 4 commands in a given sequence', async (ctx) => {
    const s = new RtspSession({ uri: 'rtsp://whatever/path' })
    let calls = 0
    const methods: Array<RTSP_METHOD> = []
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
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    s.incoming.on('finish', () => {
      assert.is(methods.join(), ['OPTIONS', 'DESCRIBE', 'SETUP', 'PLAY'].join())
      // clean up any outstanding timeouts (e.g. renew interval)
      s._reset()
      ctx.resolve()
    })
    s.play()
    await done
  })
})

describe('rtsp-sessiont pause', (test) => {
  test('should emit 1 PAUSE request', async (ctx) => {
    const s = new RtspSession({ uri: 'rtsp://whatever/path' })
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    s.outgoing.once('data', (req) => {
      assert.is(req.method, 'PAUSE')
      ctx.resolve()
    })
    s.pause()
    await done
  })
})

describe('rtsp-sessiont stop', (test) => {
  test('should emit 1 TEARDOWN request', async (ctx) => {
    const s = new RtspSession({ uri: 'rtsp://whatever/path' }) as any
    // Fake that SETUP was issued to trigger an actual TEARDOWN
    s._sessionId = '18315797286303868614'
    const done = new Promise((resolve) => (ctx.resolve = resolve))

    s.outgoing.once('data', (req: any) => {
      assert.is(req.method, 'TEARDOWN')
      ctx.resolve()
    })
    s.stop()
    await done
  })
})
