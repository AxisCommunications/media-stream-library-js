import { WebSocket, Server } from 'mock-socket';
import { WSSource } from '.';
import StreamFactory from '../helpers/stream-factory';
import { Sink } from '../component';
import { runComponentTests } from '../../utils/validate-component';
var server = new Server('ws://hostname');
var socket = new WebSocket('ws://hostname');
var spy = jest.fn();
var source = new WSSource(socket);
var sink = new Sink(StreamFactory.consumer(spy), StreamFactory.producer());
source.connect(sink);
runComponentTests(source, 'websocket component');
test('websocket component has two streams', function () {
    expect(source).toHaveProperty('incoming');
    expect(source).toHaveProperty('outgoing');
});
test('websocket incoming emits data on message', function (done) {
    // Prepare data to be sent by server, send it, then close the connection.
    var send = ['data1', 'data2', 'x', 'SOAP :/', 'bunch of XML'];
    server.on('connection', function (socket) {
        send.forEach(function (data) { return socket.send(data); });
        server.close();
    });
    // Wait for stream to end, then check what has happened.
    sink.incoming.on('finish', function () {
        expect(spy).toHaveBeenCalledTimes(send.length);
        var receive = spy.mock.calls.map(function (args) { return args[0].data.toString(); });
        expect(send).toEqual(receive);
        done();
    });
});
//# sourceMappingURL=index.test.js.map