"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("../component");
const stream_1 = require("stream");
const message_1 = require("../message");
const rtp_1 = require("../../utils/protocols/rtp");
class ONVIFDepay extends component_1.Tube {
    constructor(handler) {
        let XMLPayloadType;
        let packets = [];
        const incoming = new stream_1.Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                if (msg.type === message_1.MessageType.SDP) {
                    let validMedia;
                    for (const media of msg.sdp.media) {
                        if (media.type === 'application' &&
                            media.rtpmap &&
                            media.rtpmap.encodingName === 'VND.ONVIF.METADATA') {
                            validMedia = media;
                        }
                    }
                    if (validMedia && validMedia.rtpmap) {
                        XMLPayloadType = Number(validMedia.rtpmap.payloadType);
                    }
                    callback(undefined, msg);
                }
                else if (msg.type === message_1.MessageType.RTP &&
                    rtp_1.payloadType(msg.data) === XMLPayloadType) {
                    // Add payload to packet stack
                    packets.push(rtp_1.payload(msg.data));
                    // XML over RTP uses the RTP marker bit to indicate end
                    // of fragmentation. At this point, the packets can be used
                    // to reconstruct an XML packet.
                    if (rtp_1.marker(msg.data) && packets.length > 0) {
                        const xmlMsg = {
                            timestamp: rtp_1.timestamp(msg.data),
                            ntpTimestamp: msg.ntpTimestamp,
                            payloadType: rtp_1.payloadType(msg.data),
                            data: Buffer.concat(packets),
                            type: message_1.MessageType.XML,
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
        super(incoming);
    }
}
exports.ONVIFDepay = ONVIFDepay;
//# sourceMappingURL=index.js.map