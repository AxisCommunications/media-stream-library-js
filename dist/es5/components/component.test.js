var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
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
var e_1, _a;
// internal classes
import { Tube, Sink, Source } from './component';
// utils
import StreamFactory from './helpers/stream-factory';
import { runComponentTests } from '../utils/validate-component';
// tests
var source = function () {
    return new Source(StreamFactory.producer(), StreamFactory.consumer());
};
var pass = function () { return new Tube(); };
var sink = function () { return new Sink(StreamFactory.consumer(), StreamFactory.producer()); };
// Validate components.
var components = {
    source: source,
    pass: pass,
    sink: sink,
};
try {
    for (var _b = __values(Object.entries(components)), _c = _b.next(); !_c.done; _c = _b.next()) {
        var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
        runComponentTests(value(), key);
    }
}
catch (e_1_1) { e_1 = { error: e_1_1 }; }
finally {
    try {
        if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
    }
    finally { if (e_1) throw e_1.error; }
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
var badPairs = [
    [source, source],
    [pass, source],
    [sink, source],
    [sink, pass],
    [sink, sink],
];
var goodPairs = [
    [source, pass],
    [source, sink],
    [pass, pass],
    [pass, sink],
];
describe('connect', function () {
    test('bad pairs should not be allowed to be connected', function () {
        var e_2, _a;
        var _loop_1 = function (srcGen, dstGen) {
            var src = srcGen();
            var dst = dstGen();
            expect(function () { return src.connect(dst); }).toThrowError('connection failed');
        };
        try {
            for (var badPairs_1 = __values(badPairs), badPairs_1_1 = badPairs_1.next(); !badPairs_1_1.done; badPairs_1_1 = badPairs_1.next()) {
                var _b = __read(badPairs_1_1.value, 2), srcGen = _b[0], dstGen = _b[1];
                _loop_1(srcGen, dstGen);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (badPairs_1_1 && !badPairs_1_1.done && (_a = badPairs_1.return)) _a.call(badPairs_1);
            }
            finally { if (e_2) throw e_2.error; }
        }
    });
    test('good pairs should be able to connect without throwing', function () {
        var e_3, _a;
        try {
            for (var goodPairs_1 = __values(goodPairs), goodPairs_1_1 = goodPairs_1.next(); !goodPairs_1_1.done; goodPairs_1_1 = goodPairs_1.next()) {
                var _b = __read(goodPairs_1_1.value, 2), srcGen = _b[0], dstGen = _b[1];
                var src = srcGen();
                var dst = dstGen();
                expect(src.connect(dst)).toBe(dst);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (goodPairs_1_1 && !goodPairs_1_1.done && (_a = goodPairs_1.return)) _a.call(goodPairs_1);
            }
            finally { if (e_3) throw e_3.error; }
        }
    });
    test('null components should not break the chaining', function () {
        var src = source();
        var dst = sink();
        expect(src.connect(null).connect(dst)).toBe(dst);
    });
    test('already connected source should not be allowed to connect', function () {
        var src = source();
        var dst1 = sink();
        var dst2 = sink();
        src.connect(dst1);
        expect(function () { return src.connect(dst2); }).toThrowError('connection failed');
    });
    test('already connected destination should not be allowed to connect', function () {
        var src1 = source();
        var src2 = source();
        var dst = sink();
        src1.connect(dst);
        expect(function () { return src2.connect(dst); }).toThrowError('connection failed');
    });
});
describe('disconnect', function () {
    test('not-connected components should be able to disconnect', function () {
        var src = source();
        expect(src.disconnect()).toBe(src);
    });
    test('connected components should be able to disconnect', function () {
        var src = source();
        var dst = sink();
        src.connect(dst);
        expect(src.disconnect()).toBe(src);
    });
    test('disconnected components should be able to reconnect', function () {
        var src = source();
        var dst = sink();
        src.connect(dst);
        src.disconnect();
        expect(src.connect(dst)).toBe(dst);
    });
});
describe('error propagation', function () {
    test('errors should be propagated if connected', function () {
        var src = source();
        var dst = sink();
        // Set up spies that will be called when an error occurs
        var srcIncomingError = jest.fn();
        var srcOutgoingError = jest.fn();
        var dstIncomingError = jest.fn();
        var dstOutgoingError = jest.fn();
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
    test('errors should not be propagated depending if disconnected', function () {
        var src = source();
        var dst = sink();
        // Set up spies that will be called when an error occurs
        var srcIncomingError = jest.fn();
        var srcOutgoingError = jest.fn();
        var dstIncomingError = jest.fn();
        var dstOutgoingError = jest.fn();
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