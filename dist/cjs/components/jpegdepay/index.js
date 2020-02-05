"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const component_1 = require("../component");
const message_1 = require("../message");
const parser_1 = require("./parser");
const stream_1 = require("stream");
const rtp_1 = require("../../utils/protocols/rtp");
class JPEGDepay extends component_1.Tube {
    constructor() {
        let jpegPayloadType;
        let packets = [];
        let jpegDepay;
        const incoming = new stream_1.Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                if (msg.type === message_1.MessageType.SDP) {
                    const jpegMedia = msg.sdp.media.find((media) => {
                        return (media.type === 'video' &&
                            media.rtpmap !== undefined &&
                            media.rtpmap.encodingName === 'JPEG');
                    });
                    if (jpegMedia !== undefined && jpegMedia.rtpmap !== undefined) {
                        jpegPayloadType = Number(jpegMedia.rtpmap.payloadType);
                        const framesize = jpegMedia.framesize;
                        // `framesize` is an SDP field that is present in e.g. Axis camera's
                        // and is used because the width and height that can be sent inside
                        // the JPEG header are both limited to 2040.
                        // If present, we use this width and height as the default values
                        // to be used by the jpeg depay function, otherwise we ignore this
                        // and let the JPEG header inside the RTP packets determine this.
                        if (framesize !== undefined) {
                            const [width, height] = framesize;
                            // msg.framesize = { width, height }
                            jpegDepay = parser_1.jpegDepayFactory(width, height);
                        }
                        else {
                            jpegDepay = parser_1.jpegDepayFactory();
                        }
                    }
                    callback(undefined, msg);
                }
                else if (msg.type === message_1.MessageType.RTP &&
                    rtp_1.payloadType(msg.data) === jpegPayloadType) {
                    packets.push(msg.data);
                    // JPEG over RTP uses the RTP marker bit to indicate end
                    // of fragmentation. At this point, the packets can be used
                    // to reconstruct a JPEG frame.
                    if (rtp_1.marker(msg.data) && packets.length > 0) {
                        const jpegFrame = jpegDepay(packets);
                        this.push({
                            timestamp: rtp_1.timestamp(msg.data),
                            ntpTimestamp: msg.ntpTimestamp,
                            payloadType: rtp_1.payloadType(msg.data),
                            data: jpegFrame.data,
                            framesize: jpegFrame.size,
                            type: message_1.MessageType.JPEG,
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
        super(incoming);
    }
}
exports.JPEGDepay = JPEGDepay;
//# sourceMappingURL=index.js.map