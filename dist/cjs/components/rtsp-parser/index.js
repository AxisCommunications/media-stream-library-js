"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("../component");
const stream_1 = require("stream");
const message_1 = require("../message");
const builder_1 = require("./builder");
const parser_1 = require("./parser");
/**
 * A component that converts raw binary data into RTP/RTSP/RTCP packets on the
 * incoming stream, and converts RTSP commands to raw binary data on the outgoing
 * stream. The component is agnostic of any RTSP session details (you need an
 * RTSP session component in the pipeline).
 * @extends {Component}
 */
class RtspParser extends component_1.Tube {
    /**
     * Create a new RTSP parser component.
     * @return {undefined}
     */
    constructor() {
        const parser = new parser_1.Parser();
        // Incoming stream
        const incoming = new stream_1.Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                if (msg.type === message_1.MessageType.RAW) {
                    parser.parse(msg.data).forEach(message => incoming.push(message));
                    callback();
                }
                else {
                    // Not a message we should handle
                    callback(undefined, msg);
                }
            },
        });
        // Outgoing stream
        const outgoing = new stream_1.Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                if (msg.type === message_1.MessageType.RTSP) {
                    const data = builder_1.builder(msg);
                    callback(undefined, { type: message_1.MessageType.RAW, data });
                }
                else {
                    // don't touch other types
                    callback(undefined, msg);
                }
            },
        });
        super(incoming, outgoing);
    }
}
exports.RtspParser = RtspParser;
//# sourceMappingURL=index.js.map