"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// internal classes
const component_1 = require("./component");
// utils
const stream_factory_1 = __importDefault(require("./helpers/stream-factory"));
const validate_component_1 = require("../utils/validate-component");
// tests
const source = () => new component_1.Source(stream_factory_1.default.producer(), stream_factory_1.default.consumer());
const pass = () => new component_1.Tube();
const sink = () => new component_1.Sink(stream_factory_1.default.consumer(), stream_factory_1.default.producer());
// Validate components.
const components = {
    source,
    pass,
    sink,
};
for (const [key, value] of Object.entries(components)) {
    validate_component_1.runComponentTests(value(), key);
}
/**
 * Components can only be connected when they have complementary
 * incoming and outgoing streams. The following tests assure that
 * the 'attach' method catches bad combinations.
 *
 * Schematic of components:
 *
 *     +-----------+                     +-----------+
 *     |           <---+                 |           <---+
 *     |           |     X               |           |
 *     |   source  |     X               |   source  |
 *     |           |     X               |           |
 *     |           +--->                 |           +--->
 *     +-----------+                     +-----------+
 *
 *     +-----------+                     +-----------+
 * <-------------------+             <-------------------+
 *     |           |     X         X     |           |
 *     |   pass    |     X         X     |   pass    |
 *     |           |     X         X     |           |
 * +------------------->             +------------------->
 *     +-----------+                     +-----------+
 *
 *     +-----------+                     +-----------+
 * <---+           |                 <---+           |
 *     |           |               X     |           |
 *     |   sink    |               X     |   sink    |
 *     |           |               X     |           |
 * +--->           |                 +--->           |
 *     +-----------+                     +-----------+
 */
const badPairs = [
    [source, source],
    [pass, source],
    [sink, source],
    [sink, pass],
    [sink, sink],
];
const goodPairs = [
    [source, pass],
    [source, sink],
    [pass, pass],
    [pass, sink],
];
describe('connect', () => {
    test('bad pairs should not be allowed to be connected', () => {
        for (const [srcGen, dstGen] of badPairs) {
            const src = srcGen();
            const dst = dstGen();
            expect(() => src.connect(dst)).toThrowError('connection failed');
        }
    });
    test('good pairs should be able to connect without throwing', () => {
        for (const [srcGen, dstGen] of goodPairs) {
            const src = srcGen();
            const dst = dstGen();
            expect(src.connect(dst)).toBe(dst);
        }
    });
    test('null components should not break the chaining', () => {
        const src = source();
        const dst = sink();
        expect(src.connect(null).connect(dst)).toBe(dst);
    });
    test('already connected source should not be allowed to connect', () => {
        const src = source();
        const dst1 = sink();
        const dst2 = sink();
        src.connect(dst1);
        expect(() => src.connect(dst2)).toThrowError('connection failed');
    });
    test('already connected destination should not be allowed to connect', () => {
        const src1 = source();
        const src2 = source();
        const dst = sink();
        src1.connect(dst);
        expect(() => src2.connect(dst)).toThrowError('connection failed');
    });
});
describe('disconnect', () => {
    test('not-connected components should be able to disconnect', () => {
        const src = source();
        expect(src.disconnect()).toBe(src);
    });
    test('connected components should be able to disconnect', () => {
        const src = source();
        const dst = sink();
        src.connect(dst);
        expect(src.disconnect()).toBe(src);
    });
    test('disconnected components should be able to reconnect', () => {
        const src = source();
        const dst = sink();
        src.connect(dst);
        src.disconnect();
        expect(src.connect(dst)).toBe(dst);
    });
});
describe('error propagation', () => {
    test('errors should be propagated if connected', () => {
        const src = source();
        const dst = sink();
        // Set up spies that will be called when an error occurs
        const srcIncomingError = jest.fn();
        const srcOutgoingError = jest.fn();
        const dstIncomingError = jest.fn();
        const dstOutgoingError = jest.fn();
        // Handle all error events (jest doesn't like unhandled events)
        src.incoming.on('error', srcIncomingError);
        src.outgoing.on('error', srcOutgoingError);
        dst.incoming.on('error', dstIncomingError);
        dst.outgoing.on('error', dstOutgoingError);
        src.connect(dst);
        dst.incoming.emit('error', 'testError');
        expect(srcIncomingError).toHaveBeenCalledWith('testError');
        src.outgoing.emit('error', 'testError');
        expect(dstOutgoingError).toHaveBeenCalledWith('testError');
    });
    test('errors should not be propagated depending if disconnected', () => {
        const src = source();
        const dst = sink();
        // Set up spies that will be called when an error occurs
        const srcIncomingError = jest.fn();
        const srcOutgoingError = jest.fn();
        const dstIncomingError = jest.fn();
        const dstOutgoingError = jest.fn();
        // Handle all error events (jest doesn't like unhandled events)
        src.incoming.on('error', srcIncomingError);
        src.outgoing.on('error', srcOutgoingError);
        dst.incoming.on('error', dstIncomingError);
        dst.outgoing.on('error', dstOutgoingError);
        src.connect(dst);
        src.disconnect();
        dst.incoming.emit('error', 'testError');
        expect(srcIncomingError).not.toHaveBeenCalled();
        src.outgoing.emit('error', 'testError');
        expect(dstOutgoingError).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=component.test.js.map