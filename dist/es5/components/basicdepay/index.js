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
import { MessageType } from '../message';
import { marker, payload, payloadType, timestamp, } from '../../utils/protocols/rtp';
import { createTransform } from '../messageStreams';
var BasicDepay = /** @class */ (function (_super) {
    __extends(BasicDepay, _super);
    function BasicDepay(rtpPayloadType) {
        var _this = this;
        if (rtpPayloadType === undefined) {
            throw new Error('you must supply a payload type to BasicDepayComponent');
        }
        var buffer = Buffer.alloc(0);
        var incoming = createTransform(function (msg, encoding, callback) {
            if (msg.type === MessageType.RTP &&
                payloadType(msg.data) === rtpPayloadType) {
                var rtpPayload = payload(msg.data);
                buffer = Buffer.concat([buffer, rtpPayload]);
                if (marker(msg.data)) {
                    if (buffer.length > 0) {
                        this.push({
                            data: buffer,
                            timestamp: timestamp(msg.data),
                            ntpTimestamp: msg.ntpTimestamp,
                            payloadType: payloadType(msg.data),
                            type: MessageType.ELEMENTARY,
                        });
                    }
                    buffer = Buffer.alloc(0);
                }
                callback();
            }
            else {
                // Not a message we should handle
                callback(undefined, msg);
            }
        });
        // outgoing will be defaulted to a PassThrough stream
        _this = _super.call(this, incoming) || this;
        return _this;
    }
    return BasicDepay;
}(Tube));
export { BasicDepay };
//# sourceMappingURL=index.js.map