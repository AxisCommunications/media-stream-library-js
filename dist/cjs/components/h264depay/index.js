"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("../component");
const stream_1 = require("stream");
const message_1 = require("../message");
const rtp_1 = require("../../utils/protocols/rtp");
const parser_1 = require("./parser");
class H264Depay extends component_1.Tube {
    constructor() {
        let h264PayloadType;
        let prevNalType;
        let idrFound = false;
        // Incoming
        let buffer = Buffer.alloc(0);
        let parseMessage = () => Buffer.alloc(0);
        let checkIdr = (msg) => {
            const rtpPayload = rtp_1.payload(msg.data);
            const nalType = rtpPayload[0] & 0x1f;
            if ((nalType === 28 && prevNalType === 8) || (nalType === 5)) {
                idrFound = true;
            }
            prevNalType = nalType;
        };
        const incoming = new stream_1.Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                // Get correct payload types from sdp to identify video and audio
                if (msg.type === message_1.MessageType.SDP) {
                    const h264Media = msg.sdp.media.find((media) => {
                        return (media.type === 'video' &&
                            media.rtpmap !== undefined &&
                            media.rtpmap.encodingName === 'H264');
                    });
                    if (h264Media !== undefined && h264Media.rtpmap !== undefined) {
                        h264PayloadType = h264Media.rtpmap.payloadType;
                    }
                    callback(undefined, msg); // Pass on the original SDP message
                }
                else if (msg.type === message_1.MessageType.RTP &&
                    rtp_1.payloadType(msg.data) === h264PayloadType) {
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
        const callback = incoming.push.bind(incoming);
        parseMessage = (buffer, rtp) => parser_1.h264depay(buffer, rtp, callback);
        // outgoing will be defaulted to a PassThrough stream
        super(incoming);
    }
}
exports.H264Depay = H264Depay;
//# sourceMappingURL=index.js.map