var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { Tube } from '../component';
import StreamFactory from '../helpers/stream-factory';
import { createWriteStream } from 'fs';
import { join } from 'path';
/**
 * Component that writes passing incoming/outgoing streams
 * interleaved to a filestream. The resulting stream (file) stores
 * messages as a JSON array, where each element has a type, timestamp,
 * and the original message (that went through the stream).
 */
var Recorder = /** @class */ (function (_super) {
    __extends(Recorder, _super);
    /**
     * Create a new recorder component that will record to a writable stream.
     * @param {Stream} fileStream The stream to save the messages to.
     * @return {undefined}
     */
    function Recorder(fileStream) {
        var e_1, _a;
        var _this = this;
        var incoming = StreamFactory.recorder('incoming', fileStream);
        var outgoing = StreamFactory.recorder('outgoing', fileStream);
        var interleaved = { incoming: incoming, outgoing: outgoing };
        var streamsFinished = [];
        var _loop_1 = function (key, value) {
            streamsFinished.push(new Promise(function (resolve) {
                return value.on('finish', function () {
                    var timestamp = Date.now();
                    var message = null;
                    var type = key;
                    fileStream.write(JSON.stringify({ type: type, timestamp: timestamp, message: message }, null, 2));
                    fileStream.write(',\n');
                    resolve();
                });
            }));
        };
        try {
            for (var _b = __values(Object.entries(interleaved)), _c = _b.next(); !_c.done; _c = _b.next()) {
                var _d = __read(_c.value, 2), key = _d[0], value = _d[1];
                _loop_1(key, value);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
        // start of file: begin JSON array
        fileStream.write('[\n');
        // end of file: close JSON array
        Promise.all(streamsFinished)
            .then(function () {
            fileStream.write(JSON.stringify(null));
            fileStream.write('\n]\n');
        })
            .catch(function () {
            /** ignore */
        });
        _this = _super.call(this, incoming, outgoing) || this;
        return _this;
    }
    /**
     * Create a new recorder component that will record to a file.
     * @param {String} filename The name of the file (relative to cwd)
     * @return {RecorderComponent}
     */
    Recorder.toFile = function (filename) {
        if (filename === void 0) { filename = 'data.json'; }
        var cwd = process.cwd();
        var fileStream = createWriteStream(join(cwd, filename));
        return new Recorder(fileStream);
    };
    return Recorder;
}(Tube));
export { Recorder };
//# sourceMappingURL=index.js.map