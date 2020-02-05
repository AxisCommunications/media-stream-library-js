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
import { MessageType } from '../message';
import { builder } from './builder';
import { Parser } from './parser';
/**
 * A component that converts raw binary data into RTP/RTSP/RTCP packets on the
 * incoming stream, and converts RTSP commands to raw binary data on the outgoing
 * stream. The component is agnostic of any RTSP session details (you need an
 * RTSP session component in the pipeline).
 * @extends {Component}
 */
var RtspParser = /** @class */ (function (_super) {
    __extends(RtspParser, _super);
    /**
     * Create a new RTSP parser component.
     * @return {undefined}
     */
    function RtspParser() {
        var _this = this;
        var parser = new Parser();
        // Incoming stream
        var incoming = new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                if (msg.type === MessageType.RAW) {
                    parser.parse(msg.data).forEach(function (message) { return incoming.push(message); });
                    callback();
                }
                else {
                    // Not a message we should handle
                    callback(undefined, msg);
                }
            },
        });
        // Outgoing stream
        var outgoing = new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                if (msg.type === MessageType.RTSP) {
                    var data = builder(msg);
                    callback(undefined, { type: MessageType.RAW, data: data });
                }
                else {
                    // don't touch other types
                    callback(undefined, msg);
                }
            },
        });
        _this = _super.call(this, incoming, outgoing) || this;
        return _this;
    }
    return RtspParser;
}(Tube));
export { RtspParser };
//# sourceMappingURL=index.js.map