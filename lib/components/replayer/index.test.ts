import StreamFactory from '../helpers/stream-factory'
import { runComponentTests } from '../../utils/validate-component'
import { Replayer } from '.'
import { Sink } from '../component'

const replayer = new Replayer(StreamFactory.producer([]))
runComponentTests(replayer, 'websocket component')

test('replayer emits data', (done) => {
  const send = [{ data: 'spam' }, { data: 'eggs' }]
  const fakePackets = [
    { delay: 10, type: 'incoming', msg: send[0] },
    { delay: 10, type: 'incoming', msg: send[1] },
    { delay: 10, type: 'incoming', msg: null },
  ]
  const replayer = new Replayer(StreamFactory.producer(fakePackets as any))

  // Prepare data to be sent by server, send it, then close the connection.
  const logger = jest.fn()
  const sink = Sink.fromHandler(logger)

  replayer.connect(sink)

  // Wait for stream to end, then check what has happened.
  sink.incoming.on('finish', () => {
    expect(logger).toHaveBeenCalledTimes(fakePackets.length - 1)
    const receive = logger.mock.calls.map((args) => args[0])
    expect(send).toEqual(receive)
    done()
  })
})
