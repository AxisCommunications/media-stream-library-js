import * as assert from 'uvu/assert'
import { describe } from './uvu-describe'

import { responses } from './rtsp-session.fixtures'

import { RtspSession } from '../src/streams/components'

import { decode, encode } from '../src/streams/components/utils/bytes'
import { consumer } from '../src/streams/components/utils/streams'
import { axisRtspMediaUri } from '../src/streams/defaults'

describe('rtsp-session', (test) => {
  test('correct generated default uri', () => {
    const uri = axisRtspMediaUri('hostname')
    assert.is(uri, 'rtsp://hostname/axis-media/media.amp')
  })

  test('separate commands', async () => {
    const rtsp = new RtspSession({
      uri: 'rtsp://192.168.0.90/axis-media/media.amp',
    })

    const drain = rtsp.demuxer.readable.pipeTo(consumer())
    const rspWriter = rtsp.demuxer.writable.getWriter()
    const reqReader = rtsp.commands.getReader()

    /**
     * DESCRIBE
     */

    const describe = rtsp.describe()

    // MOCK describe request/response
    const { value: describeRequest } = await reqReader.read()
    assert.ok(describeRequest)
    assert.is(
      decode(describeRequest),
      'DESCRIBE rtsp://192.168.0.90/axis-media/media.amp RTSP/1.0\r\nAccept: application/sdp\r\nCSeq: 0\r\n\r\n',
      'describe request'
    )
    await rspWriter.write(encode(responses.DESCRIBE))

    const sdp = await describe

    /**
     * SETUP
     */

    const setup = rtsp.setup(sdp)

    // MOCK setup request/response (3 pairs expected for this setup)
    const { value: setupVideo } = await reqReader.read()
    assert.ok(setupVideo)
    assert.is(
      decode(setupVideo),
      'SETUP rtsp://192.168.0.90/axis-media/media.amp/stream=0?video=1&audio=1&svg=on RTSP/1.0\r\nBlocksize: 64000\r\nTransport: RTP/AVP/TCP;unicast;interleaved=0-1\r\nCSeq: 1\r\n\r\n',
      'video setup request'
    )
    await rspWriter.write(encode(responses.SETUP_VIDEO))
    const { value: setupAudio } = await reqReader.read()
    assert.ok(setupAudio)
    assert.is(
      decode(setupAudio),
      'SETUP rtsp://192.168.0.90/axis-media/media.amp/stream=1?video=1&audio=1&svg=on RTSP/1.0\r\nBlocksize: 64000\r\nTransport: RTP/AVP/TCP;unicast;interleaved=2-3\r\nSession: Bk48Ak7wjcWaAgRD\r\nCSeq: 2\r\n\r\n',
      'audio setup request'
    )
    await rspWriter.write(encode(responses.SETUP_VIDEO))
    const { value: setupApplication } = await reqReader.read()
    assert.ok(setupApplication)
    assert.is(
      decode(setupApplication),
      'SETUP rtsp://192.168.0.90/axis-media/media.amp/stream=2?video=1&audio=1&svg=on RTSP/1.0\r\nBlocksize: 64000\r\nTransport: RTP/AVP/TCP;unicast;interleaved=4-5\r\nSession: Bk48Ak7wjcWaAgRD\r\nCSeq: 3\r\n\r\n',
      'application setup request'
    )
    await rspWriter.write(encode(responses.SETUP_APPLICATION))

    await setup

    /**
     * keep-alive
     */

    assert.ok(
      // @ts-ignore access private property
      rtsp.keepaliveInterval,
      'expect session to be kept alive after setup'
    )
    // @ts-ignore access private property
    assert.is(rtsp.sessionId, 'Bk48Ak7wjcWaAgRD', 'session ID')

    /**
     * PLAY
     */

    const play = rtsp.play(678)

    // MOCK play request/response
    const { value: playRequest } = await reqReader.read()
    assert.ok(playRequest)
    assert.is(
      decode(playRequest),
      'PLAY rtsp://192.168.0.90/axis-media/media.amp?video=1&audio=1&svg=on RTSP/1.0\r\nRange: npt=678-\r\nSession: Bk48Ak7wjcWaAgRD\r\nCSeq: 4\r\n\r\n',
      'play request'
    )
    await rspWriter.write(encode(responses.PLAY))

    const range = await play
    assert.equal(range, ['678', ''])

    /**
     * OPTIONS
     */

    const options = rtsp.options()

    // MOCK options request/response
    const { value: optionsRequest } = await reqReader.read()
    assert.ok(optionsRequest)
    assert.is(
      decode(optionsRequest),
      'OPTIONS rtsp://192.168.0.90/axis-media/media.amp?video=1&audio=1&svg=on RTSP/1.0\r\nSession: Bk48Ak7wjcWaAgRD\r\nCSeq: 5\r\n\r\n',
      'options request'
    )
    await rspWriter.write(encode(responses.OPTIONS))

    await options

    /**
     * PAUSE
     */

    const pause = rtsp.pause()

    // MOCK pause request/response
    const { value: pauseRequest } = await reqReader.read()
    assert.ok(pauseRequest)
    assert.is(
      decode(pauseRequest),
      'PAUSE rtsp://192.168.0.90/axis-media/media.amp?video=1&audio=1&svg=on RTSP/1.0\r\nSession: Bk48Ak7wjcWaAgRD\r\nCSeq: 6\r\n\r\n',
      'pause request'
    )
    await rspWriter.write(encode(responses.PAUSE))

    await pause

    /**
     * TEARDOWN
     */

    const teardown = rtsp.teardown()

    // MOCK teardown request/response
    const { value: teardownRequest } = await reqReader.read()
    assert.ok(teardownRequest)
    assert.is(
      decode(teardownRequest),
      'TEARDOWN rtsp://192.168.0.90/axis-media/media.amp?video=1&audio=1&svg=on RTSP/1.0\r\nSession: Bk48Ak7wjcWaAgRD\r\nCSeq: 7\r\n\r\n',
      'teardown request'
    )
    await rspWriter.write(encode(responses.TEARDOWN))

    await teardown

    /**
     * session finished
     */

    assert.not.ok(
      // @ts-ignore access private property
      rtsp.keepaliveInterval,
      'no keepalive for ended session'
    )
    // @ts-ignore access private property
    assert.is(rtsp.sessionId, undefined, 'no session ID')

    // @ts-ignore
    rspWriter.close()

    await drain
    console.log('drained')
  })

  test('start should end up playing stream', async () => {
    const rtsp = new RtspSession({
      uri: 'rtsp://192.168.0.90/axis-media/media.amp',
    })

    // MOCK an RTSP server
    let downstreamController: ReadableStreamDefaultController
    let upstreamController: WritableStreamDefaultController
    const responseStack = Object.values(responses)
    const downstream = new ReadableStream<unknown>({
      start(controller) {
        downstreamController = controller
      },
    })
    const upstream = new WritableStream({
      start(controller) {
        upstreamController = controller
      },
      write() {
        downstreamController.enqueue(encode(responseStack.shift() ?? ''))
      },
    })

    const drain = Promise.allSettled([
      downstream.pipeThrough(rtsp.demuxer).pipeTo(consumer()),
      rtsp.commands.pipeTo(upstream),
    ])

    const result = await rtsp.start(678)
    assert.ok(result.sdp)
    assert.is(
      result.sdp.session.control,
      'rtsp://192.168.0.90/axis-media/media.amp?video=1&audio=1&svg=on'
    )
    assert.equal(result.range, ['678', ''])

    await rtsp.options()
    await rtsp.pause()
    await rtsp.teardown()

    // @ts-ignore
    downstreamController.close()
    // @ts-ignore
    upstreamController.error()

    await drain
    console.log('done')
  })
})
