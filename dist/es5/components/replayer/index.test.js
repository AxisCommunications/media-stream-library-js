import StreamFactory from '../helpers/stream-factory';
import { runComponentTests } from '../../utils/validate-component';
import { Replayer } from '.';
import { Sink } from '../component';
var replayer = new Replayer(StreamFactory.producer([]));
runComponentTests(replayer, 'websocket component');
test('replayer emits data', function (done) {
    var send = [{ data: 'spam' }, { data: 'eggs' }];
    var fakePackets = [
        { delay: 10, type: 'incoming', msg: send[0] },
        { delay: 10, type: 'incoming', msg: send[1] },
        { delay: 10, type: 'incoming', msg: null },
    ];
    var replayer = new Replayer(StreamFactory.producer(fakePackets));
    // Prepare data to be sent by server, send it, then close the connection.
    var logger = jest.fn();
    var sink = Sink.fromHandler(logger);
    replayer.connect(sink);
    // Wait for stream to end, then check what has happened.
    sink.incoming.on('finish', function () {
        expect(logger).toHaveBeenCalledTimes(fakePackets.length - 1);
        var receive = logger.mock.calls.map(function (args) { return args[0]; });
        expect(send).toEqual(receive);
        done();
    });
});
//# sourceMappingURL=index.test.js.map