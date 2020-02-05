import { payloadType } from '../../utils/protocols/rtp';
import { Tube } from '../component';
import { MessageType } from '../message';
import { parse } from './parser';
import { createTransform } from '../messageStreams';
/*
media: [{ type: 'video',
   port: '0',
   proto: 'RTP/AVP',
   fmt: '96',
   rtpmap: '96 H264/90000',
   fmtp: {
      format: '96',
      parameters: {
        'packetization-mode': '1',
        'profile-level-id': '4d0029',
        'sprop-parameter-sets': 'Z00AKeKQDwBE/LgLcBAQGkHiRFQ=,aO48gA==',
      },
    },
   control: 'rtsp://hostname/axis-media/media.amp/stream=0?audio=1&video=1',
   framerate: '25.000000',
   transform: [[1, 0, 0], [0, 0.75, 0], [0, 0, 1]] },
   { type: 'audio',
     port: '0',
     proto: 'RTP/AVP',
     fmt: '97',
     fmtp: {
       parameters: {
         bitrate: '32000',
         config: '1408',
         indexdeltalength: '3',
         indexlength: '3',
         mode: 'AAC-hbr',
         'profile-level-id': '2',
         sizelength: '13',
         streamtype: '5'
       },
       format: '97'
     },
     rtpmap: '97 MPEG4-GENERIC/16000/1',
     control: 'rtsp://hostname/axis-media/media.amp/stream=1?audio=1&video=1' }]
*/
export class AACDepay extends Tube {
    constructor() {
        let AACPayloadType;
        let hasHeader;
        const incoming = createTransform(function (msg, encoding, callback) {
            if (msg.type === MessageType.SDP) {
                // Check if there is an AAC track in the SDP
                let validMedia;
                for (const media of msg.sdp.media) {
                    if (media.type === 'audio' &&
                        media.fmtp &&
                        media.fmtp.parameters &&
                        media.fmtp.parameters.mode === 'AAC-hbr') {
                        validMedia = media;
                    }
                }
                if (validMedia && validMedia.rtpmap !== undefined) {
                    AACPayloadType = Number(validMedia.rtpmap.payloadType);
                    const parameters = validMedia.fmtp.parameters;
                    // Required
                    const sizeLength = Number(parameters.sizelength) || 0;
                    const indexLength = Number(parameters.indexlength) || 0;
                    const indexDeltaLength = Number(parameters.indexdeltalength) || 0;
                    // Optionals
                    const CTSDeltaLength = Number(parameters.ctsdeltalength) || 0;
                    const DTSDeltaLength = Number(parameters.dtsdeltalength) || 0;
                    const RandomAccessIndication = Number(parameters.randomaccessindication) || 0;
                    const StreamStateIndication = Number(parameters.streamstateindication) || 0;
                    const AuxiliaryDataSizeLength = Number(parameters.auxiliarydatasizelength) || 0;
                    hasHeader =
                        sizeLength +
                            Math.max(indexLength, indexDeltaLength) +
                            CTSDeltaLength +
                            DTSDeltaLength +
                            RandomAccessIndication +
                            StreamStateIndication +
                            AuxiliaryDataSizeLength >
                            0;
                }
                callback(undefined, msg);
            }
            else if (msg.type === MessageType.RTP &&
                payloadType(msg.data) === AACPayloadType) {
                parse(msg, hasHeader, this.push.bind(this));
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
//# sourceMappingURL=index.js.map