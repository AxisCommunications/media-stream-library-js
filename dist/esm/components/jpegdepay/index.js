import { Tube } from '../component';
import { MessageType } from '../message';
import { jpegDepayFactory } from './parser';
import { Transform } from 'stream';
import { payloadType, timestamp, marker } from '../../utils/protocols/rtp';
export class JPEGDepay extends Tube {
    constructor() {
        let jpegPayloadType;
        let packets = [];
        let jpegDepay;
        const incoming = new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                if (msg.type === MessageType.SDP) {
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
                        const jpegFrame = jpegDepay(packets);
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
        super(incoming);
    }
}
//# sourceMappingURL=index.js.map