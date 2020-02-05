import { MessageType } from '../message';
import { payload, timestamp, payloadType } from '../../utils/protocols/rtp';
import debug from 'debug';
export var NAL_TYPES;
(function (NAL_TYPES) {
    NAL_TYPES[NAL_TYPES["UNSPECIFIED"] = 0] = "UNSPECIFIED";
    NAL_TYPES[NAL_TYPES["NON_IDR_PICTURE"] = 1] = "NON_IDR_PICTURE";
    NAL_TYPES[NAL_TYPES["IDR_PICTURE"] = 5] = "IDR_PICTURE";
    NAL_TYPES[NAL_TYPES["SPS"] = 7] = "SPS";
    NAL_TYPES[NAL_TYPES["PPS"] = 8] = "PPS";
})(NAL_TYPES || (NAL_TYPES = {}));
/*
First byte in payload (rtp payload header):
      +---------------+
      |0|1|2|3|4|5|6|7|
      +-+-+-+-+-+-+-+-+
      |F|NRI|  Type   |
      +---------------+

2nd byte in payload: FU header (if type in first byte is 28)
      +---------------+
      |0|1|2|3|4|5|6|7|
      +-+-+-+-+-+-+-+-+
      |S|E|R|  Type   | S = start, E = end
      +---------------+
*/
var h264Debug = debug('msl:h264depay');
export function h264depay(buffered, rtp, callback) {
    var rtpPayload = payload(rtp.data);
    var type = rtpPayload[0] & 0x1f;
    if (type === 28) {
        /* FU-A NALU */ var fuIndicator = rtpPayload[0];
        var fuHeader = rtpPayload[1];
        var startBit = !!(fuHeader >> 7);
        var nalType = fuHeader & 0x1f;
        var nal = (fuIndicator & 0xe0) | nalType;
        var stopBit = fuHeader & 64;
        if (startBit) {
            return Buffer.concat([
                Buffer.from([0, 0, 0, 0, nal]),
                rtpPayload.slice(2),
            ]);
        }
        else if (stopBit) {
            /* receieved end bit */ var h264frame = Buffer.concat([
                buffered,
                rtpPayload.slice(2),
            ]);
            h264frame.writeUInt32BE(h264frame.length - 4, 0);
            var msg = {
                data: h264frame,
                type: MessageType.H264,
                timestamp: timestamp(rtp.data),
                ntpTimestamp: rtp.ntpTimestamp,
                payloadType: payloadType(rtp.data),
                nalType: nalType,
            };
            callback(msg);
            return Buffer.alloc(0);
        }
        else {
            // Put the received data on the buffer and cut the header bytes
            return Buffer.concat([buffered, rtpPayload.slice(2)]);
        }
    }
    else if ((type === NAL_TYPES.NON_IDR_PICTURE || type === NAL_TYPES.IDR_PICTURE) &&
        buffered.length === 0) {
        /* Single NALU */ var h264frame = Buffer.concat([
            Buffer.from([0, 0, 0, 0]),
            rtpPayload,
        ]);
        h264frame.writeUInt32BE(h264frame.length - 4, 0);
        var msg = {
            data: h264frame,
            type: MessageType.H264,
            timestamp: timestamp(rtp.data),
            ntpTimestamp: rtp.ntpTimestamp,
            payloadType: payloadType(rtp.data),
            nalType: type,
        };
        callback(msg);
        return Buffer.alloc(0);
    }
    else {
        h264Debug("H264depayComponent can only extract types 1,5 and 28, got " + type);
        return Buffer.alloc(0);
    }
}
//# sourceMappingURL=parser.js.map