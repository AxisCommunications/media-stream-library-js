import * as assert from 'uvu/assert'

import { Sink, Source } from 'components/component'
import StreamFactory from 'components/helpers/stream-factory'
import { Message } from 'components/message'
import { Recorder } from 'components/recorder'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

describe('recorder component', (test) => {
  const fakeStorage = () => {
    /** empty */
  }
  const recorder = new Recorder(StreamFactory.consumer(fakeStorage))

  runComponentTests(recorder, 'recorder', test)

  test('recorder saves data', async (ctx) => {
    // Prepare data to be sent by server, send it, then close the connection.
    const send = [{ data: 'spam' }, { data: 'eggs' }]
    ctx.loggerCalled = 0
    ctx.loggerData = []
    const logger = (msg: Message) => {
      ctx.loggerCalled++
      ctx.loggerData.push(msg)
    }

    const source = Source.fromMessages(send as any) // We want to signal end of stream.
    const sink = Sink.fromHandler(logger)

    source.connect(recorder).connect(sink)

    const done = new Promise((resolve) => (ctx.resolve = resolve))
    // Wait for stream to end, then check what has happened.
    sink.incoming.on('finish', () => {
      assert.is(ctx.loggerCalled, send.length)
      assert.equal(send, ctx.loggerData)
      ctx.resolve()
    })
    await done
  })
})
