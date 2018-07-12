// internal classes
const Component = require('../component')
const WebSocketComponent = require('./')
// internal classes

// utils
const StreamFactory = require('../helpers/stream-factory')

// mocks
const {WebSocket, Server} = require('mock-socket')

// tests
const validateComponent = require('../../utils/validate-component')

const server = new Server('ws://hostname')
const socket = new WebSocket('ws://hostname')

const spy = jest.fn()

const source = new WebSocketComponent(socket)
const sink = new Component(StreamFactory.consumer(spy), StreamFactory.producer())

source.connect(sink)

validateComponent(source, 'websocket component')

test('websocket component has two streams', () => {
  expect(source).toHaveProperty('incoming')
  expect(source).toHaveProperty('outgoing')
})

test('websocket incoming emits data on message', (done) => {
  // Prepare data to be sent by server, send it, then close the connection.
  const send = ['data1', 'data2', 'x', 'SOAP :/', 'bunch of XML']
  server.on('connection', socket => {
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
