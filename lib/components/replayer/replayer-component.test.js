// internal classes
const Component = require('../component')
const ReplayComponent = require('./')
// internal classes

// utils
const StreamFactory = require('../helpers/stream-factory')

// tests
const validateComponent = require('../../utils/validate-component')

const fakeStorage = jest.fn()
const replayer = new ReplayComponent(StreamFactory.consumer(fakeStorage))
validateComponent(replayer, 'websocket component')

test('replayer emits data', (done) => {
  const send = [{ data: 'spam' }, { data: 'eggs' }]
  const fakePackets = [
    { delay: 10, type: 'incoming', msg: send[0] },
    { delay: 10, type: 'incoming', msg: send[1] },
    { delay: 10, type: 'incoming', msg: null }
  ]
  const replayer = new ReplayComponent(StreamFactory.producer(fakePackets))

  // Prepare data to be sent by server, send it, then close the connection.
  const logger = jest.fn()
  const sink = Component.sink(logger)

  replayer.connect(sink)

  // Wait for stream to end, then check what has happened.
  sink.incoming.on('finish', () => {
    expect(logger).toHaveBeenCalledTimes(fakePackets.length - 1)
    const receive = logger.mock.calls.map((args) => args[0])
    expect(send).toEqual(receive)
    done()
  })
})
