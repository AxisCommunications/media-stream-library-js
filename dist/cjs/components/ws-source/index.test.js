"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mock_socket_1 = require("mock-socket");
const _1 = require(".");
const stream_factory_1 = __importDefault(require("../helpers/stream-factory"));
const component_1 = require("../component");
const validate_component_1 = require("../../utils/validate-component");
const server = new mock_socket_1.Server('ws://hostname');
const socket = new mock_socket_1.WebSocket('ws://hostname');
const spy = jest.fn();
const source = new _1.WSSource(socket);
const sink = new component_1.Sink(stream_factory_1.default.consumer(spy), stream_factory_1.default.producer());
source.connect(sink);
validate_component_1.runComponentTests(source, 'websocket component');
test('websocket component has two streams', () => {
    expect(source).toHaveProperty('incoming');
    expect(source).toHaveProperty('outgoing');
});
test('websocket incoming emits data on message', done => {
    // Prepare data to be sent by server, send it, then close the connection.
    const send = ['data1', 'data2', 'x', 'SOAP :/', 'bunch of XML'];
    server.on('connection', socket => {
        send.forEach(data => socket.send(data));
        server.close();
    });
    // Wait for stream to end, then check what has happened.
    sink.incoming.on('finish', () => {
        expect(spy).toHaveBeenCalledTimes(send.length);
        const receive = spy.mock.calls.map(args => args[0].data.toString());
        expect(send).toEqual(receive);
        done();
    });
});
//# sourceMappingURL=index.test.js.map