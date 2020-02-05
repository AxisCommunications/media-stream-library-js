var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
import { Mp4Capture } from '.';
import { runComponentTests } from '../../utils/validate-component';
import { MessageType } from '../message';
import { Source, Sink } from '../component';
// Mocks
var MOCK_BUFFER_SIZE = 10; // Jest has problems with large buffers
var MOCK_MOVIE_DATA = 0xff;
var MOCK_MOVIE_ENDING_DATA = 0xfe;
// A movie consists of ISOM packets, starting with an SDP packet.
// We want to simulate the beginning and end of a movie, as well
// as non-movie packets.
var MOCK_MOVIE = [MessageType.SDP, MessageType.ISOM, MessageType.ISOM].map(function (type) {
    return { type: type, data: Buffer.allocUnsafe(1).fill(MOCK_MOVIE_DATA) };
});
var MOCK_MOVIE_BUFFER = Buffer.alloc(2).fill(MOCK_MOVIE_DATA);
var MOCK_MOVIE_ENDING = [
    MessageType.ISOM,
    MessageType.ISOM,
    MessageType.ISOM,
    MessageType.ISOM,
].map(function (type) {
    return { type: type, data: Buffer.allocUnsafe(1).fill(MOCK_MOVIE_ENDING_DATA) };
});
var MOCK_NOT_MOVIE = ['', ''].map(function (type) {
    return {
        type: type,
        data: Buffer.allocUnsafe(1).fill(0),
    };
});
var copySpies = function (type, messages) {
    return messages
        .filter(function (msg) { return msg.type === type; })
        .map(function (msg) { return jest.spyOn(msg.data, 'copy'); });
};
/**
 * Set up a pipeline: source - capture - sink.
 * @param  {Array} fragments Messages to send from source.
 * @return {Object} Components and function to start flow.
 */
var pipelineFactory = function () {
    var _a;
    var fragments = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        fragments[_i] = arguments[_i];
    }
    var sourceMessages = (_a = []).concat.apply(_a, __spread(fragments));
    var sinkHandler = jest.fn();
    var source = Source.fromMessages(sourceMessages);
    var capture = new Mp4Capture(MOCK_BUFFER_SIZE);
    var sink = Sink.fromHandler(sinkHandler);
    return {
        source: source,
        capture: capture,
        sink: sink,
        sinkHandler: sinkHandler,
        flow: function () { return source.connect(capture).connect(sink); },
    };
};
// Tests
describe('it should follow standard component rules', function () {
    var mp4capture = new Mp4Capture();
    runComponentTests(mp4capture, 'mp4capture component');
});
describe('data copying', function () {
    test('should not occur when capture inactive', function (done) {
        var pipeline = pipelineFactory(MOCK_MOVIE);
        // Spy on the copy method of the underlying movie data.
        var shouldNotCopy = copySpies(MessageType.ISOM, MOCK_MOVIE);
        // Start the pipeline (this will flow the messages)
        pipeline.flow();
        pipeline.sink.incoming.on('finish', function () {
            shouldNotCopy.forEach(function (copy) { return expect(copy).not.toHaveBeenCalled(); });
            expect(pipeline.sinkHandler.mock.calls.length).toBe(MOCK_MOVIE.length);
            done();
        });
    });
    test('should occur when capture active', function (done) {
        var pipeline = pipelineFactory(MOCK_MOVIE);
        // Spy on the copy method of the underlying movie data.
        var shouldCopy = copySpies(MessageType.ISOM, MOCK_MOVIE);
        // Activate capture.
        var captureHandler = jest.fn();
        pipeline.capture.start(captureHandler);
        // Start the pipeline (this will flow the messages)
        pipeline.flow();
        pipeline.sink.incoming.on('finish', function () {
            shouldCopy.forEach(function (copy) { return expect(copy).toHaveBeenCalled(); });
            expect(captureHandler).toHaveBeenCalledWith(MOCK_MOVIE_BUFFER);
            done();
        });
    });
    test('should only occur when new movie has started', function (done) {
        var pipeline = pipelineFactory(MOCK_MOVIE_ENDING, MOCK_MOVIE);
        var shouldNotCopy = copySpies(MessageType.ISOM, MOCK_MOVIE_ENDING);
        var shouldCopy = copySpies(MessageType.ISOM, MOCK_MOVIE);
        // Activate capture.
        var captureHandler = jest.fn();
        pipeline.capture.start(captureHandler);
        // Start the pipeline (this will flow the messages)
        pipeline.flow();
        pipeline.sink.incoming.on('finish', function () {
            shouldNotCopy.forEach(function (copy) { return expect(copy).not.toHaveBeenCalled(); });
            shouldCopy.forEach(function (copy) { return expect(copy).toHaveBeenCalled(); });
            expect(captureHandler).toHaveBeenCalledWith(MOCK_MOVIE_BUFFER);
            done();
        });
    });
    test('should not occur when not a movie', function (done) {
        var pipeline = pipelineFactory(MOCK_MOVIE, MOCK_NOT_MOVIE);
        var shouldCopy = copySpies(MessageType.ISOM, MOCK_MOVIE);
        var shouldNotCopy = copySpies(MessageType.ISOM, MOCK_NOT_MOVIE);
        // Activate capture.
        var captureHandler = jest.fn();
        pipeline.capture.start(captureHandler);
        // Start the pipeline (this will flow the messages)
        pipeline.flow();
        pipeline.sink.incoming.on('finish', function () {
            shouldCopy.forEach(function (copy) { return expect(copy).toHaveBeenCalled(); });
            shouldNotCopy.forEach(function (copy) { return expect(copy).not.toHaveBeenCalled(); });
            expect(captureHandler).toHaveBeenCalledWith(MOCK_MOVIE_BUFFER);
            done();
        });
    });
    test('should stop when requested', function (done) {
        var pipeline = pipelineFactory(MOCK_MOVIE, MOCK_MOVIE_ENDING);
        var shouldCopy = copySpies(MessageType.ISOM, MOCK_MOVIE);
        var shouldNotCopy = copySpies(MessageType.ISOM, MOCK_NOT_MOVIE);
        // Activate capture.
        var captureHandler = jest.fn();
        pipeline.capture.start(captureHandler);
        pipeline.source.incoming.on('data', function (msg) {
            if (msg.data[0] === 0xfe) {
                pipeline.capture.stop();
            }
        });
        // Start the pipeline (this will flow the messages)
        pipeline.flow();
        pipeline.sink.incoming.on('finish', function () {
            shouldCopy.forEach(function (copy) { return expect(copy).toHaveBeenCalled(); });
            shouldNotCopy.forEach(function (copy) { return expect(copy).not.toHaveBeenCalled(); });
            expect(captureHandler).toHaveBeenCalledWith(MOCK_MOVIE_BUFFER);
            done();
        });
    });
});
//# sourceMappingURL=index.test.js.map