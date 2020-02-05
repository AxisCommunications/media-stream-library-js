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
import { Sink } from '../component';
import { Writable, Readable } from 'stream';
import { MessageType } from '../message';
import { packetType, BYE } from '../../utils/protocols/rtcp';
var TRIGGER_THRESHOLD = 100;
var MseSink = /** @class */ (function (_super) {
    __extends(MseSink, _super);
    /**
     * Create a Media component.
     *
     * The constructor sets up two streams and connects them to the MediaSource.
     *
     * @param {MediaSource} mse - A media source.
     */
    function MseSink(el) {
        var _this = this;
        if (el === undefined) {
            throw new Error('video element argument missing');
        }
        var mse;
        var sourceBuffer;
        /**
         * Set up an incoming stream and attach it to the sourceBuffer.
         * @type {Writable}
         */
        var incoming = new Writable({
            objectMode: true,
            write: function (msg, encoding, callback) {
                if (msg.type === MessageType.SDP) {
                    // Start a new movie (new SDP info available)
                    _this._lastCheckpointTime = 0;
                    // Set up a list of tracks that contain info about
                    // the type of media, encoding, and codec are present.
                    var tracks_1 = msg.sdp.media.map(function (media) {
                        return {
                            type: media.type,
                            encoding: media.rtpmap && media.rtpmap.encodingName,
                            mime: media.mime,
                            codec: media.codec,
                        };
                    });
                    // Start a new mediaSource and prepare it with a sourceBuffer.
                    // When ready, this component's .onSourceOpen callback will be called
                    // with the mediaSource, and a list of valid/ignored media.
                    mse = new MediaSource();
                    el.src = window.URL.createObjectURL(mse);
                    var handler_1 = function () {
                        mse.removeEventListener('sourceopen', handler_1);
                        _this.onSourceOpen && _this.onSourceOpen(mse, tracks_1);
                        var mimeCodecs = tracks_1
                            .map(function (track) { return track.mime; })
                            .filter(function (mime) { return mime; })
                            .join(', ');
                        sourceBuffer = _this.addSourceBuffer(el, mse, "video/mp4; codecs=\"" + mimeCodecs + "\"");
                        callback();
                    };
                    mse.addEventListener('sourceopen', handler_1);
                }
                else if (msg.type === MessageType.ISOM) {
                    _this._lastCheckpointTime =
                        msg.checkpointTime !== undefined
                            ? msg.checkpointTime
                            : _this._lastCheckpointTime;
                    // ISO BMFF Byte Stream data to be added to the source buffer
                    _this._done = callback;
                    try {
                        sourceBuffer.appendBuffer(msg.data);
                    }
                    catch (e) {
                        // do nothing
                    }
                }
                else if (msg.type === MessageType.RTCP) {
                    if (packetType(msg.data) === BYE.packetType) {
                        mse.readyState === 'open' && mse.endOfStream();
                    }
                    callback();
                }
                else {
                    callback();
                }
            },
        });
        incoming.on('finish', function () {
            mse && mse.readyState === 'open' && mse.endOfStream();
        });
        // When an error is sent on the incoming stream, close it.
        incoming.on('error', function () {
            if (sourceBuffer.updating) {
                sourceBuffer.addEventListener('updateend', function () {
                    mse.readyState === 'open' && mse.endOfStream();
                });
            }
            else {
                mse.readyState === 'open' && mse.endOfStream();
            }
        });
        /**
         * Set up outgoing stream.
         * @type {Writable}
         */
        var outgoing = new Readable({
            objectMode: true,
            read: function () {
                //
            },
        });
        // When an error is sent on the outgoing stream, whine about it.
        outgoing.on('error', function () {
            console.warn('outgoing stream broke somewhere');
        });
        /**
         * initialize the component.
         */
        _this = _super.call(this, incoming, outgoing) || this;
        _this._videoEl = el;
        _this._lastCheckpointTime = 0;
        return _this;
    }
    /**
     * Add a new sourceBuffer to the mediaSource and remove old ones.
     * @param {HTMLMediaElement} el  The media element holding the media source.
     * @param {MediaSource} mse  The media source the buffer should be attached to.
     * @param {String} [mimeType='video/mp4; codecs="avc1.4D0029, mp4a.40.2"'] [description]
     */
    MseSink.prototype.addSourceBuffer = function (el, mse, mimeType) {
        var _this = this;
        var sourceBuffer = mse.addSourceBuffer(mimeType);
        var trigger = 0;
        var onUpdateEndHandler = function () {
            ++trigger;
            if (trigger > TRIGGER_THRESHOLD && sourceBuffer.buffered.length) {
                trigger = 0;
                var index = sourceBuffer.buffered.length - 1;
                var start = sourceBuffer.buffered.start(index);
                var end = Math.min(el.currentTime, _this._lastCheckpointTime) - 10;
                try {
                    // remove all material up to 10 seconds before current time
                    if (end > start) {
                        sourceBuffer.remove(start, end);
                        return; // this._done() will be called on the next updateend event!
                    }
                }
                catch (e) {
                    console.warn(e);
                }
            }
            _this._done && _this._done();
        };
        sourceBuffer.addEventListener('updateend', onUpdateEndHandler);
        return sourceBuffer;
    };
    Object.defineProperty(MseSink.prototype, "currentTime", {
        get: function () {
            return this._videoEl.currentTime;
        },
        enumerable: true,
        configurable: true
    });
    MseSink.prototype.play = function () {
        return this._videoEl.play();
    };
    MseSink.prototype.pause = function () {
        return this._videoEl.pause();
    };
    return MseSink;
}(Sink));
export { MseSink };
//# sourceMappingURL=index.js.map