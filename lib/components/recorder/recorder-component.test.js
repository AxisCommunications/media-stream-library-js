// internal classes
const Component = require('../component')
const RecorderComponent = require('./recorder-component')
// internal classes

// utils
const StreamFactory = require('../helpers/stream-factory')

// tests
const validateComponent = require('../../utils/validate-component')

const fakeStorage = jest.fn()
const recorder = new RecorderComponent(StreamFactory.consumer(fakeStorage))
validateComponent(recorder, 'websocket component')

test('recorder saves data', (done) => {
  const fakeStorage = jest.fn()
  const recorder = new RecorderComponent(StreamFactory.consumer(fakeStorage))

  // Prepare data to be sent by server, send it, then close the connection.
  const send = [{ data: 'spam' }, { data: 'eggs' }]
  const logger = jest.fn()
  const source = Component.source(send.concat(null)) // We want to signal end of stream.
  const sink = Component.sink(logger)

  source.connect(recorder).connect(sink)

  // Wait for stream to end, then check what has happened.
  sink.incoming.on('finish', () => {
    expect(logger).toHaveBeenCalledTimes(send.length)
    const receive = logger.mock.calls.map((args) => args[0])
    expect(send).toEqual(receive)
    done()
  })
})
