import * as assert from 'uvu/assert'

import { Sink } from 'components/component'
import StreamFactory from 'components/helpers/stream-factory'
import { Message } from 'components/message'
import { Replayer } from 'components/replayer'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

describe('replayer component', (test) => {
  const send = [{ data: 'spam' }, { data: 'eggs' }]
  const fakePackets = [
    { delay: 10, type: 'incoming', msg: send[0] },
    { delay: 10, type: 'incoming', msg: send[1] },
    { delay: 10, type: 'incoming', msg: null },
  ]

  const replayer = new Replayer(StreamFactory.producer(fakePackets as any))

  runComponentTests(replayer, 'replayer', test)

  test('replayer emits data', async (ctx) => {
    // Prepare data to be sent by server, send it, then close the connection.
    ctx.loggerCalled = 0
    ctx.loggerData = []
    const logger = (msg: Message) => {
      ctx.loggerCalled++
      ctx.loggerData.push(msg)
    }
    const sink = Sink.fromHandler(logger)

    replayer.connect(sink)

    // Wait for stream to end, then check what has happened.
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    sink.incoming.on('finish', () => {
      assert.is(ctx.loggerCalled, fakePackets.length - 1)
      assert.equal(send, ctx.loggerData)
      ctx.resolve()
    })
    await done
  })
})
