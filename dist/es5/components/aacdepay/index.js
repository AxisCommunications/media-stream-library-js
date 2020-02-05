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
var AACDepay = /** @class */ (function (_super) {
    __extends(AACDepay, _super);
    function AACDepay() {
        var _this = this;
        var AACPayloadType;
        var hasHeader;
        var incoming = createTransform(function (msg, encoding, callback) {
            var e_1, _a;
            if (msg.type === MessageType.SDP) {
                // Check if there is an AAC track in the SDP
                var validMedia = void 0;
                try {
                    for (var _b = __values(msg.sdp.media), _c = _b.next(); !_c.done; _c = _b.next()) {
                        var media = _c.value;
                        if (media.type === 'audio' &&
                            media.fmtp &&
                            media.fmtp.parameters &&
                            media.fmtp.parameters.mode === 'AAC-hbr') {
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
                if (validMedia && validMedia.rtpmap !== undefined) {
                    AACPayloadType = Number(validMedia.rtpmap.payloadType);
                    var parameters = validMedia.fmtp.parameters;
                    // Required
                    var sizeLength = Number(parameters.sizelength) || 0;
                    var indexLength = Number(parameters.indexlength) || 0;
                    var indexDeltaLength = Number(parameters.indexdeltalength) || 0;
                    // Optionals
                    var CTSDeltaLength = Number(parameters.ctsdeltalength) || 0;
                    var DTSDeltaLength = Number(parameters.dtsdeltalength) || 0;
                    var RandomAccessIndication = Number(parameters.randomaccessindication) || 0;
                    var StreamStateIndication = Number(parameters.streamstateindication) || 0;
                    var AuxiliaryDataSizeLength = Number(parameters.auxiliarydatasizelength) || 0;
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
        _this = _super.call(this, incoming) || this;
        return _this;
    }
    return AACDepay;
}(Tube));
export { AACDepay };
//# sourceMappingURL=index.js.map