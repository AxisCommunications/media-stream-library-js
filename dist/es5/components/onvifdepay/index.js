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
import { Tube } from '../component';
import { Transform } from 'stream';
import { MessageType } from '../message';
import { payloadType, payload, marker, timestamp, } from '../../utils/protocols/rtp';
var ONVIFDepay = /** @class */ (function (_super) {
    __extends(ONVIFDepay, _super);
    function ONVIFDepay(handler) {
        var _this = this;
        var XMLPayloadType;
        var packets = [];
        var incoming = new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                var e_1, _a;
                if (msg.type === MessageType.SDP) {
                    var validMedia = void 0;
                    try {
                        for (var _b = __values(msg.sdp.media), _c = _b.next(); !_c.done; _c = _b.next()) {
                            var media = _c.value;
                            if (media.type === 'application' &&
                                media.rtpmap &&
                                media.rtpmap.encodingName === 'VND.ONVIF.METADATA') {
                                validMedia = media;
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    if (validMedia && validMedia.rtpmap) {
                        XMLPayloadType = Number(validMedia.rtpmap.payloadType);
                    }
                    callback(undefined, msg);
                }
                else if (msg.type === MessageType.RTP &&
                    payloadType(msg.data) === XMLPayloadType) {
                    // Add payload to packet stack
                    packets.push(payload(msg.data));
                    // XML over RTP uses the RTP marker bit to indicate end
                    // of fragmentation. At this point, the packets can be used
                    // to reconstruct an XML packet.
                    if (marker(msg.data) && packets.length > 0) {
                        var xmlMsg = {
                            timestamp: timestamp(msg.data),
                            ntpTimestamp: msg.ntpTimestamp,
                            payloadType: payloadType(msg.data),
                            data: Buffer.concat(packets),
                            type: MessageType.XML,
                        };
                        // If there is a handler, the XML message will leave
                        // through the handler, otherwise send it on to the
                        // next component
                        if (handler) {
                            handler(xmlMsg);
                        }
                        else {
                            this.push(xmlMsg);
                        }
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
    return ONVIFDepay;
}(Tube));
export { ONVIFDepay };
//# sourceMappingURL=index.js.map