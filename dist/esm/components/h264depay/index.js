import { Tube } from '../component';
import { Transform } from 'stream';
import { MessageType } from '../message';
import { payload, payloadType } from '../../utils/protocols/rtp';
import { h264depay } from './parser';
export class H264Depay extends Tube {
    constructor() {
        let h264PayloadType;
        let prevNalType;
        let idrFound = false;
        // Incoming
        let buffer = Buffer.alloc(0);
        let parseMessage = () => Buffer.alloc(0);
        let checkIdr = (msg) => {
            const rtpPayload = payload(msg.data);
            const nalType = rtpPayload[0] & 0x1f;
            if ((nalType === 28 && prevNalType === 8) || (nalType === 5)) {
                idrFound = true;
            }
            prevNalType = nalType;
        };
        const incoming = new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                // Get correct payload types from sdp to identify video and audio
                if (msg.type === MessageType.SDP) {
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
        const callback = incoming.push.bind(incoming);
        parseMessage = (buffer, rtp) => h264depay(buffer, rtp, callback);
        // outgoing will be defaulted to a PassThrough stream
        super(incoming);
    }
}
//# sourceMappingURL=index.js.map