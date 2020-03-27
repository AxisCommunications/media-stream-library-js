import { Recorder } from '.'
import { runComponentTests } from '../../utils/validate-component'
import StreamFactory from '../helpers/stream-factory'
import { Source, Sink } from '../component'

const fakeStorage = jest.fn()
const recorder = new Recorder(StreamFactory.consumer(fakeStorage))
runComponentTests(recorder, 'websocket component')

test('recorder saves data', (done) => {
  const fakeStorage = jest.fn()
  const recorder = new Recorder(StreamFactory.consumer(fakeStorage))

  // Prepare data to be sent by server, send it, then close the connection.
  const send = [{ data: 'spam' }, { data: 'eggs' }]
  const logger = jest.fn()
  const source = Source.fromMessages(send as any) // We want to signal end of stream.
  const sink = Sink.fromHandler(logger)

  source.connect(recorder).connect(sink)

  // Wait for stream to end, then check what has happened.
  sink.incoming.on('finish', () => {
    expect(logger).toHaveBeenCalledTimes(send.length)
    const receive = logger.mock.calls.map((args) => args[0])
    expect(send).toEqual(receive)
    done()
  })
})
