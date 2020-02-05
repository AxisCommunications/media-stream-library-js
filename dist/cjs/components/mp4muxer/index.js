"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const message_1 = require("../message");
const debug_1 = __importDefault(require("debug"));
const isom_1 = require("./helpers/isom");
const boxbuilder_1 = require("./helpers/boxbuilder");
const stream_1 = require("stream");
const component_1 = require("../component");
const parser_1 = require("../h264depay/parser");
/**
 * Component that converts elementary stream data into MP4 boxes honouring
 * the ISO BMFF Byte Stream (Some extra restrictions are involved).
 */
class Mp4Muxer extends component_1.Tube {
    /**
     * Create a new mp4muxer component.
     * @return {undefined}
     */
    constructor() {
        const boxBuilder = new boxbuilder_1.BoxBuilder();
        const onSync = (ntpPresentationTime) => {
            this.onSync && this.onSync(ntpPresentationTime);
        };
        const incoming = new stream_1.Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                if (msg.type === message_1.MessageType.SDP) {
                    /**
                     * Arrival of SDP signals the beginning of a new movie.
                     * Set up the ftyp and moov boxes.
                     */
                    // Why is this here? These should be default inside the mvhd box?
                    const now = Math.floor(new Date().getTime() / 1000 + 2082852000);
                    const ftyp = new isom_1.Box('ftyp');
                    const moov = boxBuilder.moov(msg.sdp, now);
                    const data = Buffer.allocUnsafe(ftyp.byteLength + moov.byteLength);
                    ftyp.copy(data, 0);
                    moov.copy(data, ftyp.byteLength);
                    debug_1.default('msl:mp4:isom')(`ftyp: ${ftyp.format()}`);
                    debug_1.default('msl:mp4:isom')(`moov: ${moov.format()}`);
                    this.push(msg); // Pass on the original SDP message
                    this.push({ type: message_1.MessageType.ISOM, data, ftyp, moov });
                }
                else if (msg.type === message_1.MessageType.ELEMENTARY ||
                    msg.type === message_1.MessageType.H264) {
                    /**
                     * Otherwise we are getting some elementary stream data.
                     * Set up the moof and mdat boxes.
                     */
                    const { payloadType, timestamp, ntpTimestamp } = msg;
                    const trackId = boxBuilder.trackIdMap[payloadType];
                    if (trackId) {
                        if (!boxBuilder.ntpPresentationTime) {
                            boxBuilder.setPresentationTime(trackId, ntpTimestamp);
                            if (boxBuilder.ntpPresentationTime) {
                                onSync(boxBuilder.ntpPresentationTime);
                            }
                        }
                        let checkpointTime = undefined;
                        const idrPicture = msg.type === message_1.MessageType.H264
                            ? msg.nalType === parser_1.NAL_TYPES.IDR_PICTURE
                            : undefined;
                        if (boxBuilder.ntpPresentationTime &&
                            idrPicture &&
                            msg.ntpTimestamp !== undefined) {
                            checkpointTime =
                                (msg.ntpTimestamp - boxBuilder.ntpPresentationTime) / 1000;
                        }
                        const byteLength = msg.data.byteLength;
                        const moof = boxBuilder.moof({ trackId, timestamp, byteLength });
                        const mdat = boxBuilder.mdat(msg.data);
                        const data = Buffer.allocUnsafe(moof.byteLength + mdat.byteLength);
                        moof.copy(data, 0);
                        mdat.copy(data, moof.byteLength);
                        this.push({
                            type: message_1.MessageType.ISOM,
                            data,
                            moof,
                            mdat,
                            ntpTimestamp,
                            checkpointTime,
                        });
                    }
                }
                else {
                    // No message type we recognize, pass it on.
                    this.push(msg);
                }
                callback();
            },
        });
        super(incoming);
        this.boxBuilder = boxBuilder;
    }
    get bitrate() {
        return (this.boxBuilder.trackData &&
            this.boxBuilder.trackData.map(data => data.bitrate));
    }
    get framerate() {
        return (this.boxBuilder.trackData &&
            this.boxBuilder.trackData.map(data => data.framerate));
    }
    get ntpPresentationTime() {
        return this.boxBuilder.ntpPresentationTime;
    }
}
exports.Mp4Muxer = Mp4Muxer;
//# sourceMappingURL=index.js.map