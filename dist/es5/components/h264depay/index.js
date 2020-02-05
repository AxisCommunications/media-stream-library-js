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
import { payload, payloadType } from '../../utils/protocols/rtp';
import { h264depay } from './parser';
var H264Depay = /** @class */ (function (_super) {
    __extends(H264Depay, _super);
    function H264Depay() {
        var _this = this;
        var h264PayloadType;
        var prevNalType;
        var idrFound = false;
        // Incoming
        var buffer = Buffer.alloc(0);
        var parseMessage = function () {
            return Buffer.alloc(0);
        };
        var checkIdr = function (msg) {
            var rtpPayload = payload(msg.data);
            var nalType = rtpPayload[0] & 0x1f;
            if ((nalType === 28 && prevNalType === 8) || (nalType === 5)) {
                idrFound = true;
            }
            prevNalType = nalType;
        };
        var incoming = new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                // Get correct payload types from sdp to identify video and audio
                if (msg.type === MessageType.SDP) {
                    var h264Media = msg.sdp.media.find(function (media) {
                        return (media.type === 'video' &&
                            media.rtpmap !== undefined &&
                            media.rtpmap.encodingName === 'H264');
                    });
                    if (h264Media !== undefined && h264Media.rtpmap !== undefined) {
                        h264PayloadType = h264Media.rtpmap.payloadType;
                    }
                    callback(undefined, msg); // Pass on the original SDP message
                }
                else if (msg.type === MessageType.RTP &&
                    payloadType(msg.data) === h264PayloadType) {
                    if (!idrFound) {
                        checkIdr(msg);
                    }
                    if (idrFound) {
                        buffer = parseMessage(buffer, msg);
                    }
                    callback();
                }
                else {
                    // Not a message we should handle
                    callback(undefined, msg);
                }
            },
        });
        var callback = incoming.push.bind(incoming);
        parseMessage = function (buffer, rtp) { return h264depay(buffer, rtp, callback); };
        // outgoing will be defaulted to a PassThrough stream
        _this = _super.call(this, incoming) || this;
        return _this;
    }
    return H264Depay;
}(Tube));
export { H264Depay };
//# sourceMappingURL=index.js.map