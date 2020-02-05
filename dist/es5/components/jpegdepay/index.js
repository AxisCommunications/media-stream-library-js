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
import { MessageType } from '../message';
import { jpegDepayFactory } from './parser';
import { Transform } from 'stream';
import { payloadType, timestamp, marker } from '../../utils/protocols/rtp';
var JPEGDepay = /** @class */ (function (_super) {
    __extends(JPEGDepay, _super);
    function JPEGDepay() {
        var _this = this;
        var jpegPayloadType;
        var packets = [];
        var jpegDepay;
        var incoming = new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                if (msg.type === MessageType.SDP) {
                    var jpegMedia = msg.sdp.media.find(function (media) {
                        return (media.type === 'video' &&
                            media.rtpmap !== undefined &&
                            media.rtpmap.encodingName === 'JPEG');
                    });
                    if (jpegMedia !== undefined && jpegMedia.rtpmap !== undefined) {
                        jpegPayloadType = Number(jpegMedia.rtpmap.payloadType);
                        var framesize = jpegMedia.framesize;
                        // `framesize` is an SDP field that is present in e.g. Axis camera's
                        // and is used because the width and height that can be sent inside
                        // the JPEG header are both limited to 2040.
                        // If present, we use this width and height as the default values
                        // to be used by the jpeg depay function, otherwise we ignore this
                        // and let the JPEG header inside the RTP packets determine this.
                        if (framesize !== undefined) {
                            var _a = __read(framesize, 2), width = _a[0], height = _a[1];
                            // msg.framesize = { width, height }
                            jpegDepay = jpegDepayFactory(width, height);
                        }
                        else {
                            jpegDepay = jpegDepayFactory();
                        }
                    }
                    callback(undefined, msg);
                }
                else if (msg.type === MessageType.RTP &&
                    payloadType(msg.data) === jpegPayloadType) {
                    packets.push(msg.data);
                    // JPEG over RTP uses the RTP marker bit to indicate end
                    // of fragmentation. At this point, the packets can be used
                    // to reconstruct a JPEG frame.
                    if (marker(msg.data) && packets.length > 0) {
                        var jpegFrame = jpegDepay(packets);
                        this.push({
                            timestamp: timestamp(msg.data),
                            ntpTimestamp: msg.ntpTimestamp,
                            payloadType: payloadType(msg.data),
                            data: jpegFrame.data,
                            framesize: jpegFrame.size,
                            type: MessageType.JPEG,
                        });
                        packets = [];
                    }
                    callback();
                }
                else {
                    // Not a message we should handle
                    callback(undefined, msg);
                }
            },
        });
        // outgoing will be defaulted to a PassThrough stream
        _this = _super.call(this, incoming) || this;
        return _this;
    }
    return JPEGDepay;
}(Tube));
export { JPEGDepay };
//# sourceMappingURL=index.js.map