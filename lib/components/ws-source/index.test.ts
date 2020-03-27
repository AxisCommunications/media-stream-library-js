import { WebSocket, Server } from 'mock-socket'
import { WSSource } from '.'
import StreamFactory from '../helpers/stream-factory'
import { Sink } from '../component'
import { runComponentTests } from '../../utils/validate-component'

const server = new Server('ws://hostname')
const socket = new WebSocket('ws://hostname')

const spy = jest.fn()

const source = new WSSource(socket)
const sink = new Sink(StreamFactory.consumer(spy), StreamFactory.producer())

source.connect(sink)

runComponentTests(source, 'websocket component')

test('websocket component has two streams', () => {
  expect(source).toHaveProperty('incoming')
  expect(source).toHaveProperty('outgoing')
})

test('websocket incoming emits data on message', (done) => {
  // Prepare data to be sent by server, send it, then close the connection.
  const send = ['data1', 'data2', 'x', 'SOAP :/', 'bunch of XML']
  server.on('connection', (socket) => {
    send.forEach((data) => socket.send(data))
    server.close()
  })

  // Wait for stream to end, then check what has happened.
  sink.incoming.on('finish', () => {
    expect(spy).toHaveBeenCalledTimes(send.length)
    const receive = spy.mock.calls.map((args) => args[0].data.toString())
    expect(send).toEqual(receive)
    done()
  })
})
