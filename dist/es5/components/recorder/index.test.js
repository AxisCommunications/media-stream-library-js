import { Recorder } from '.';
import { runComponentTests } from '../../utils/validate-component';
import StreamFactory from '../helpers/stream-factory';
import { Source, Sink } from '../component';
var fakeStorage = jest.fn();
var recorder = new Recorder(StreamFactory.consumer(fakeStorage));
runComponentTests(recorder, 'websocket component');
test('recorder saves data', function (done) {
    var fakeStorage = jest.fn();
    var recorder = new Recorder(StreamFactory.consumer(fakeStorage));
    // Prepare data to be sent by server, send it, then close the connection.
    var send = [{ data: 'spam' }, { data: 'eggs' }];
    var logger = jest.fn();
    var source = Source.fromMessages(send); // We want to signal end of stream.
    var sink = Sink.fromHandler(logger);
    source.connect(recorder).connect(sink);
    // Wait for stream to end, then check what has happened.
    sink.incoming.on('finish', function () {
        expect(logger).toHaveBeenCalledTimes(send.length);
        var receive = logger.mock.calls.map(function (args) { return args[0]; });
        expect(send).toEqual(receive);
        done();
    });
});
//# sourceMappingURL=index.test.js.map