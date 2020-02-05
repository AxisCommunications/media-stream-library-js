"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("../component");
const message_1 = require("../message");
const rtp_1 = require("../../utils/protocols/rtp");
const messageStreams_1 = require("../messageStreams");
class BasicDepay extends component_1.Tube {
    constructor(rtpPayloadType) {
        if (rtpPayloadType === undefined) {
            throw new Error('you must supply a payload type to BasicDepayComponent');
        }
        let buffer = Buffer.alloc(0);
        const incoming = messageStreams_1.createTransform(function (msg, encoding, callback) {
            if (msg.type === message_1.MessageType.RTP &&
                rtp_1.payloadType(msg.data) === rtpPayloadType) {
                const rtpPayload = rtp_1.payload(msg.data);
                buffer = Buffer.concat([buffer, rtpPayload]);
                if (rtp_1.marker(msg.data)) {
                    if (buffer.length > 0) {
                        this.push({
                            data: buffer,
                            timestamp: rtp_1.timestamp(msg.data),
                            ntpTimestamp: msg.ntpTimestamp,
                            payloadType: rtp_1.payloadType(msg.data),
                            type: message_1.MessageType.ELEMENTARY,
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
        super(incoming);
    }
}
exports.BasicDepay = BasicDepay;
//# sourceMappingURL=index.js.map