"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_factory_1 = __importDefault(require("../helpers/stream-factory"));
const validate_component_1 = require("../../utils/validate-component");
const _1 = require(".");
const component_1 = require("../component");
const replayer = new _1.Replayer(stream_factory_1.default.producer([]));
validate_component_1.runComponentTests(replayer, 'websocket component');
test('replayer emits data', done => {
    const send = [{ data: 'spam' }, { data: 'eggs' }];
    const fakePackets = [
        { delay: 10, type: 'incoming', msg: send[0] },
        { delay: 10, type: 'incoming', msg: send[1] },
        { delay: 10, type: 'incoming', msg: null },
    ];
    const replayer = new _1.Replayer(stream_factory_1.default.producer(fakePackets));
    // Prepare data to be sent by server, send it, then close the connection.
    const logger = jest.fn();
    const sink = component_1.Sink.fromHandler(logger);
    replayer.connect(sink);
    // Wait for stream to end, then check what has happened.
    sink.incoming.on('finish', () => {
        expect(logger).toHaveBeenCalledTimes(fakePackets.length - 1);
        const receive = logger.mock.calls.map(args => args[0]);
        expect(send).toEqual(receive);
        done();
    });
});
//# sourceMappingURL=index.test.js.map