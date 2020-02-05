"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const validate_component_1 = require("../../utils/validate-component");
const stream_factory_1 = __importDefault(require("../helpers/stream-factory"));
const component_1 = require("../component");
const fakeStorage = jest.fn();
const recorder = new _1.Recorder(stream_factory_1.default.consumer(fakeStorage));
validate_component_1.runComponentTests(recorder, 'websocket component');
test('recorder saves data', done => {
    const fakeStorage = jest.fn();
    const recorder = new _1.Recorder(stream_factory_1.default.consumer(fakeStorage));
    // Prepare data to be sent by server, send it, then close the connection.
    const send = [{ data: 'spam' }, { data: 'eggs' }];
    const logger = jest.fn();
    const source = component_1.Source.fromMessages(send); // We want to signal end of stream.
    const sink = component_1.Sink.fromHandler(logger);
    source.connect(recorder).connect(sink);
    // Wait for stream to end, then check what has happened.
    sink.incoming.on('finish', () => {
        expect(logger).toHaveBeenCalledTimes(send.length);
        const receive = logger.mock.calls.map(args => args[0]);
        expect(send).toEqual(receive);
        done();
    });
});
//# sourceMappingURL=index.test.js.map