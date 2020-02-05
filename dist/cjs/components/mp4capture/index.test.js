"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const validate_component_1 = require("../../utils/validate-component");
const message_1 = require("../message");
const component_1 = require("../component");
// Mocks
const MOCK_BUFFER_SIZE = 10; // Jest has problems with large buffers
const MOCK_MOVIE_DATA = 0xff;
const MOCK_MOVIE_ENDING_DATA = 0xfe;
// A movie consists of ISOM packets, starting with an SDP packet.
// We want to simulate the beginning and end of a movie, as well
// as non-movie packets.
const MOCK_MOVIE = [message_1.MessageType.SDP, message_1.MessageType.ISOM, message_1.MessageType.ISOM].map(type => {
    return { type, data: Buffer.allocUnsafe(1).fill(MOCK_MOVIE_DATA) };
});
const MOCK_MOVIE_BUFFER = Buffer.alloc(2).fill(MOCK_MOVIE_DATA);
const MOCK_MOVIE_ENDING = [
    message_1.MessageType.ISOM,
    message_1.MessageType.ISOM,
    message_1.MessageType.ISOM,
    message_1.MessageType.ISOM,
].map(type => {
    return { type, data: Buffer.allocUnsafe(1).fill(MOCK_MOVIE_ENDING_DATA) };
});
const MOCK_NOT_MOVIE = ['', ''].map(type => {
    return {
        type: type,
        data: Buffer.allocUnsafe(1).fill(0),
    };
});
const copySpies = (type, messages) => {
    return messages
        .filter(msg => msg.type === type)
        .map(msg => jest.spyOn(msg.data, 'copy'));
};
/**
 * Set up a pipeline: source - capture - sink.
 * @param  {Array} fragments Messages to send from source.
 * @return {Object} Components and function to start flow.
 */
const pipelineFactory = (...fragments) => {
    const sourceMessages = [].concat(...fragments);
    const sinkHandler = jest.fn();
    const source = component_1.Source.fromMessages(sourceMessages);
    const capture = new _1.Mp4Capture(MOCK_BUFFER_SIZE);
    const sink = component_1.Sink.fromHandler(sinkHandler);
    return {
        source,
        capture,
        sink,
        sinkHandler,
        flow: () => source.connect(capture).connect(sink),
    };
};
// Tests
describe('it should follow standard component rules', () => {
    const mp4capture = new _1.Mp4Capture();
    validate_component_1.runComponentTests(mp4capture, 'mp4capture component');
});
describe('data copying', () => {
    test('should not occur when capture inactive', done => {
        const pipeline = pipelineFactory(MOCK_MOVIE);
        // Spy on the copy method of the underlying movie data.
        const shouldNotCopy = copySpies(message_1.MessageType.ISOM, MOCK_MOVIE);
        // Start the pipeline (this will flow the messages)
        pipeline.flow();
        pipeline.sink.incoming.on('finish', () => {
            shouldNotCopy.forEach(copy => expect(copy).not.toHaveBeenCalled());
            expect(pipeline.sinkHandler.mock.calls.length).toBe(MOCK_MOVIE.length);
            done();
        });
    });
    test('should occur when capture active', done => {
        const pipeline = pipelineFactory(MOCK_MOVIE);
        // Spy on the copy method of the underlying movie data.
        const shouldCopy = copySpies(message_1.MessageType.ISOM, MOCK_MOVIE);
        // Activate capture.
        const captureHandler = jest.fn();
        pipeline.capture.start(captureHandler);
        // Start the pipeline (this will flow the messages)
        pipeline.flow();
        pipeline.sink.incoming.on('finish', () => {
            shouldCopy.forEach(copy => expect(copy).toHaveBeenCalled());
            expect(captureHandler).toHaveBeenCalledWith(MOCK_MOVIE_BUFFER);
            done();
        });
    });
    test('should only occur when new movie has started', done => {
        const pipeline = pipelineFactory(MOCK_MOVIE_ENDING, MOCK_MOVIE);
        const shouldNotCopy = copySpies(message_1.MessageType.ISOM, MOCK_MOVIE_ENDING);
        const shouldCopy = copySpies(message_1.MessageType.ISOM, MOCK_MOVIE);
        // Activate capture.
        const captureHandler = jest.fn();
        pipeline.capture.start(captureHandler);
        // Start the pipeline (this will flow the messages)
        pipeline.flow();
        pipeline.sink.incoming.on('finish', () => {
            shouldNotCopy.forEach(copy => expect(copy).not.toHaveBeenCalled());
            shouldCopy.forEach(copy => expect(copy).toHaveBeenCalled());
            expect(captureHandler).toHaveBeenCalledWith(MOCK_MOVIE_BUFFER);
            done();
        });
    });
    test('should not occur when not a movie', done => {
        const pipeline = pipelineFactory(MOCK_MOVIE, MOCK_NOT_MOVIE);
        const shouldCopy = copySpies(message_1.MessageType.ISOM, MOCK_MOVIE);
        const shouldNotCopy = copySpies(message_1.MessageType.ISOM, MOCK_NOT_MOVIE);
        // Activate capture.
        const captureHandler = jest.fn();
        pipeline.capture.start(captureHandler);
        // Start the pipeline (this will flow the messages)
        pipeline.flow();
        pipeline.sink.incoming.on('finish', () => {
            shouldCopy.forEach(copy => expect(copy).toHaveBeenCalled());
            shouldNotCopy.forEach(copy => expect(copy).not.toHaveBeenCalled());
            expect(captureHandler).toHaveBeenCalledWith(MOCK_MOVIE_BUFFER);
            done();
        });
    });
    test('should stop when requested', done => {
        const pipeline = pipelineFactory(MOCK_MOVIE, MOCK_MOVIE_ENDING);
        const shouldCopy = copySpies(message_1.MessageType.ISOM, MOCK_MOVIE);
        const shouldNotCopy = copySpies(message_1.MessageType.ISOM, MOCK_NOT_MOVIE);
        // Activate capture.
        const captureHandler = jest.fn();
        pipeline.capture.start(captureHandler);
        pipeline.source.incoming.on('data', msg => {
            if (msg.data[0] === 0xfe) {
                pipeline.capture.stop();
            }
        });
        // Start the pipeline (this will flow the messages)
        pipeline.flow();
        pipeline.sink.incoming.on('finish', () => {
            shouldCopy.forEach(copy => expect(copy).toHaveBeenCalled());
            shouldNotCopy.forEach(copy => expect(copy).not.toHaveBeenCalled());
            expect(captureHandler).toHaveBeenCalledWith(MOCK_MOVIE_BUFFER);
            done();
        });
    });
});
//# sourceMappingURL=index.test.js.map