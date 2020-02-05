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
import { MessageType } from '../message';
import debug from 'debug';
import { Box } from './helpers/isom';
import { BoxBuilder } from './helpers/boxbuilder';
import { Transform } from 'stream';
import { Tube } from '../component';
import { NAL_TYPES } from '../h264depay/parser';
/**
 * Component that converts elementary stream data into MP4 boxes honouring
 * the ISO BMFF Byte Stream (Some extra restrictions are involved).
 */
var Mp4Muxer = /** @class */ (function (_super) {
    __extends(Mp4Muxer, _super);
    /**
     * Create a new mp4muxer component.
     * @return {undefined}
     */
    function Mp4Muxer() {
        var _this = this;
        var boxBuilder = new BoxBuilder();
        var onSync = function (ntpPresentationTime) {
            _this.onSync && _this.onSync(ntpPresentationTime);
        };
        var incoming = new Transform({
            objectMode: true,
            transform: function (msg, encoding, callback) {
                if (msg.type === MessageType.SDP) {
                    /**
                     * Arrival of SDP signals the beginning of a new movie.
                     * Set up the ftyp and moov boxes.
                     */
                    // Why is this here? These should be default inside the mvhd box?
                    var now = Math.floor(new Date().getTime() / 1000 + 2082852000);
                    var ftyp = new Box('ftyp');
                    var moov = boxBuilder.moov(msg.sdp, now);
                    var data = Buffer.allocUnsafe(ftyp.byteLength + moov.byteLength);
                    ftyp.copy(data, 0);
                    moov.copy(data, ftyp.byteLength);
                    debug('msl:mp4:isom')("ftyp: " + ftyp.format());
                    debug('msl:mp4:isom')("moov: " + moov.format());
                    this.push(msg); // Pass on the original SDP message
                    this.push({ type: MessageType.ISOM, data: data, ftyp: ftyp, moov: moov });
                }
                else if (msg.type === MessageType.ELEMENTARY ||
                    msg.type === MessageType.H264) {
                    /**
                     * Otherwise we are getting some elementary stream data.
                     * Set up the moof and mdat boxes.
                     */
                    var payloadType = msg.payloadType, timestamp = msg.timestamp, ntpTimestamp = msg.ntpTimestamp;
                    var trackId = boxBuilder.trackIdMap[payloadType];
                    if (trackId) {
                        if (!boxBuilder.ntpPresentationTime) {
                            boxBuilder.setPresentationTime(trackId, ntpTimestamp);
                            if (boxBuilder.ntpPresentationTime) {
                                onSync(boxBuilder.ntpPresentationTime);
                            }
                        }
                        var checkpointTime = undefined;
                        var idrPicture = msg.type === MessageType.H264
                            ? msg.nalType === NAL_TYPES.IDR_PICTURE
                            : undefined;
                        if (boxBuilder.ntpPresentationTime &&
                            idrPicture &&
                            msg.ntpTimestamp !== undefined) {
                            checkpointTime =
                                (msg.ntpTimestamp - boxBuilder.ntpPresentationTime) / 1000;
                        }
                        var byteLength = msg.data.byteLength;
                        var moof = boxBuilder.moof({ trackId: trackId, timestamp: timestamp, byteLength: byteLength });
                        var mdat = boxBuilder.mdat(msg.data);
                        var data = Buffer.allocUnsafe(moof.byteLength + mdat.byteLength);
                        moof.copy(data, 0);
                        mdat.copy(data, moof.byteLength);
                        this.push({
                            type: MessageType.ISOM,
                            data: data,
                            moof: moof,
                            mdat: mdat,
                            ntpTimestamp: ntpTimestamp,
                            checkpointTime: checkpointTime,
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
        _this = _super.call(this, incoming) || this;
        _this.boxBuilder = boxBuilder;
        return _this;
    }
    Object.defineProperty(Mp4Muxer.prototype, "bitrate", {
        get: function () {
            return (this.boxBuilder.trackData &&
                this.boxBuilder.trackData.map(function (data) { return data.bitrate; }));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Mp4Muxer.prototype, "framerate", {
        get: function () {
            return (this.boxBuilder.trackData &&
                this.boxBuilder.trackData.map(function (data) { return data.framerate; }));
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Mp4Muxer.prototype, "ntpPresentationTime", {
        get: function () {
            return this.boxBuilder.ntpPresentationTime;
        },
        enumerable: true,
        configurable: true
    });
    return Mp4Muxer;
}(Tube));
export { Mp4Muxer };
//# sourceMappingURL=index.js.map