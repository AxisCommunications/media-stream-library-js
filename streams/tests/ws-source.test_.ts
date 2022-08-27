import { Server, WebSocket } from 'mock-socket'
import * as assert from 'uvu/assert'

import { Sink } from 'components/component'
import StreamFactory from 'components/helpers/stream-factory'
import { Message } from 'components/message'
import { WSSource } from 'components/ws-source'

import { describe } from './uvu-describe'
import { runComponentTests } from './validate-component'

describe('ws-source component', (test) => {
  const server = new Server('ws://hostname')
  const ws = new WebSocket('ws://hostname')

  let called = 0
  const messages: Array<Message> = []
  const spy = (msg: Message) => {
    called++
    messages.push(msg)
  }

  const source = new WSSource(ws)
  const sink = new Sink(StreamFactory.consumer(spy), StreamFactory.producer())

  runComponentTests(source, 'websocket', test)

  test('websocket component has two streams', () => {
    assert.is.not(source.incoming, undefined)
    assert.is.not(source.outgoing, undefined)
  })

  test('websocket incoming emits data on message', async (ctx) => {
    // Prepare data to be sent by server, send it, then close the connection.
    const send = ['data1', 'data2', 'x', 'SOAP :/', 'bunch of XML']
    server.on('connection', (socket) => {
      send.forEach((data) => socket.send(data))
    })

    // Wait for stream to end, then check what has happened.
    const done = new Promise((resolve) => (ctx.resolve = resolve))
    sink.incoming.on('finish', () => {
      assert.is(called, send.length)
      assert.equal(
        send,
        messages.map(({ data }) => data.toString())
      )
      server.close()
      ws.close()
      setTimeout(() => ctx.resolve(), 2000)
    })

    source.connect(sink)

    await done
  })
})
