import * as assert from 'uvu/assert'
import { describe } from './uvu-describe'

import { Server, WebSocket } from 'mock-socket'

import { WSSource } from '../src/streams/components'

import { decode, encode } from '../src/streams/components/utils/bytes'
import { consumer } from '../src/streams/components/utils/streams'

describe('ws-source component', (test) => {
  test('websocket incoming emits data on message', async () => {
    // Prepare data to be sent by server, send it, then close the connection.
    const server = new Server('ws://host')

    const send = ['data1', 'data2', 'x', 'SOAP :/', 'bunch of XML']
    server.on('connection', (socket) => {
      socket.on('message', (message) => {
        if (decode(message as Uint8Array) === 'start') {
          send.forEach((data) => socket.send(encode(data).buffer))
          socket.close()
        }
      })
    })

    // Set up spy to listen for arrived messages
    let called = 0
    const messages: Array<string> = []
    const spy = (chunk: Uint8Array) => {
      called++
      messages.push(decode(chunk))
    }

    // Create WebSocket and wait for it to open.
    const ws = new WebSocket('ws://host')
    ws.binaryType = 'arraybuffer'
    await new Promise<void>((resolve) => {
      ws.onopen = () => resolve()
    })

    // Set up streams
    const source = new WSSource(ws)
    const sink = consumer(spy)

    // Simulate sending a starting message to trigger data flow.
    const writer = source.writable.getWriter()
    writer.write(encode('start')).catch((err) => console.error(err))

    // Wait for stream to end.
    await source.readable
      .pipeTo(sink)
      .then(() => console.log('done'))
      .catch((err) => console.error(err))

    assert.is(called, send.length)
    assert.equal(messages, send)
  })
})
