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
import { Tube } from '../component';
import { Transform } from 'stream';
var generateLogger = function (prefix, type) {
    var lastTimestamp = Date.now();
    var log = function (msg) {
        var timestamp = Date.now();
        console.log(prefix + ": +" + (timestamp - lastTimestamp) + "ms", msg);
        lastTimestamp = timestamp;
    };
    if (type === undefined) {
        return log;
    }
    else {
        return function (msg) { return msg.type === type && log(msg); };
    }
};
/**
 * Component that logs whatever is passing through.
 */
var Inspector = /** @class */ (function (_super) {
    __extends(Inspector, _super);
    /**
     * Create a new inspector component.
     * @argument {String} type  The type of message to log (default is to log all).
     * @return {undefined}
     */
    function Inspector(type) {
        var _this = this;
        var incomingLogger = generateLogger('incoming', type);
        var incoming = new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                incomingLogger(msg);
                callback(undefined, msg);
            },
        });
        var outgoingLogger = generateLogger('outgoing', type);
        var outgoing = new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                outgoingLogger(msg);
                callback(undefined, msg);
            },
        });
        _this = _super.call(this, incoming, outgoing) || this;
        return _this;
    }
    return Inspector;
}(Tube));
export { Inspector };
//# sourceMappingURL=index.js.map