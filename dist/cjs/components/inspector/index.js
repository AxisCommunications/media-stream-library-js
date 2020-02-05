"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("../component");
const stream_1 = require("stream");
const generateLogger = (prefix, type) => {
    let lastTimestamp = Date.now();
    const log = (msg) => {
        const timestamp = Date.now();
        console.log(`${prefix}: +${timestamp - lastTimestamp}ms`, msg);
        lastTimestamp = timestamp;
    };
    if (type === undefined) {
        return log;
    }
    else {
        return (msg) => msg.type === type && log(msg);
    }
};
/**
 * Component that logs whatever is passing through.
 */
class Inspector extends component_1.Tube {
    /**
     * Create a new inspector component.
     * @argument {String} type  The type of message to log (default is to log all).
     * @return {undefined}
     */
    constructor(type) {
        const incomingLogger = generateLogger('incoming', type);
        const incoming = new stream_1.Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                incomingLogger(msg);
                callback(undefined, msg);
            },
        });
        const outgoingLogger = generateLogger('outgoing', type);
        const outgoing = new stream_1.Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                outgoingLogger(msg);
                callback(undefined, msg);
            },
        });
        super(incoming, outgoing);
    }
}
exports.Inspector = Inspector;
//# sourceMappingURL=index.js.map