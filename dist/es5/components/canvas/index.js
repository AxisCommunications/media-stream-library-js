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
import { Clock } from '../../utils/clock';
import { Scheduler } from '../../utils/scheduler';
import { MessageType } from '../message';
import { Writable, Readable } from 'stream';
var resetInfo = function (info) {
    info.bitrate = 0;
    info.framerate = 0;
    info.renderedFrames = 0;
};
var generateUpdateInfo = function (clockrate) {
    var cumulativeByteLength = 0;
    var cumulativeDuration = 0;
    var cumulativeFrames = 0;
    return function (info, _a) {
        var byteLength = _a.byteLength, duration = _a.duration;
        cumulativeByteLength += byteLength;
        cumulativeDuration += duration;
        cumulativeFrames++;
        // Update the cumulative number size (bytes) and duration (ticks), and if
        // the duration exceeds the clockrate (meaning longer than 1 second of info),
        // then compute a new bitrate and reset cumulative size and duration.
        if (cumulativeDuration >= clockrate) {
            var bits = 8 * cumulativeByteLength;
            var frames_1 = cumulativeFrames;
            var seconds = cumulativeDuration / clockrate;
            info.bitrate = bits / seconds;
            info.framerate = frames_1 / seconds;
            cumulativeByteLength = 0;
            cumulativeDuration = 0;
            cumulativeFrames = 0;
        }
    };
};
/**
 * Canvas component
 *
 * Draws an incoming stream of JPEG images onto a <canvas> element.
 * The RTP timestamps are used to schedule the drawing of the images.
 * An instance can be used as a 'clock' itself, e.g. with a scheduler.
 *
 * The following handlers can be set on a component instance:
 *  - onCanplay: will be called when the first frame is ready and
 *               the correct frame size has been set on the canvas.
 *               At this point, the clock can be started by calling
 *               `.play()` method on the component.
 *  - onSync: will be called when the presentation time offset is
 *            known, with the latter as argument (in UNIX milliseconds)
 *
 * @class CanvasComponent
 * @extends {Component}
 */
var CanvasSink = /** @class */ (function (_super) {
    __extends(CanvasSink, _super);
    /**
     * Creates an instance of CanvasComponent.
     * @param { HTMLCanvasElement } el - An HTML < canvas > element
     * @memberof CanvasComponent
     */
    function CanvasSink(el) {
        var _this = this;
        if (el === undefined) {
            throw new Error('canvas element argument missing');
        }
        var firstTimestamp = 0;
        var lastTimestamp = 0;
        var clockrate = 0;
        var info = {
            bitrate: 0,
            framerate: 0,
            renderedFrames: 0,
        };
        var updateInfo;
        // The createImageBitmap function is supported in Chrome and Firefox
        // (https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap)
        // Note: drawImage can also be used instead of transferFromImageBitmap, but it caused
        // very large memory use in Chrome (goes up to ~2-3GB, then drops again).
        // Do do not call el.getContext twice, safari returns null for second call
        var ctx = null;
        if (window.createImageBitmap !== undefined) {
            ctx = el.getContext('bitmaprenderer');
        }
        if (ctx === null) {
            ctx = el.getContext('2d');
        }
        // Set up the drawing callback to be used by the scheduler,
        // it receives a blob of a JPEG image.
        var drawImageBlob;
        if (ctx === null) {
            drawImageBlob = function () {
                /** NOOP */
            };
        }
        else if ('transferFromImageBitmap' in ctx) {
            var ctxBitmaprenderer_1 = ctx;
            drawImageBlob = function (_a) {
                var blob = _a.blob;
                info.renderedFrames++;
                window
                    .createImageBitmap(blob)
                    .then(function (imageBitmap) {
                    ctxBitmaprenderer_1.transferFromImageBitmap(imageBitmap);
                })
                    .catch(function () {
                    /** ignore */
                });
            };
        }
        else {
            var ctx2d_1 = ctx;
            var img_1 = new Image();
            img_1.onload = function () {
                ctx2d_1.drawImage(img_1, 0, 0);
            };
            drawImageBlob = function (_a) {
                var blob = _a.blob;
                info.renderedFrames++;
                var url = window.URL.createObjectURL(blob);
                img_1.src = url;
            };
        }
        // Because we don't have an element that plays video for us,
        // we have to use our own clock. The clock can be started/stopped
        // with the `play` and `pause` methods, and has a `currentTime`
        // property that keeps track of the presentation time.
        // The scheduler will use the clock (instead of e.g. a video element)
        // to determine when to display the JPEG images.
        var clock = new Clock();
        var scheduler = new Scheduler(clock, drawImageBlob);
        var ntpPresentationTime = 0;
        var onCanplay = function () {
            _this.onCanplay && _this.onCanplay();
        };
        var onSync = function (ntpPresentationTime) {
            _this.onSync && _this.onSync(ntpPresentationTime);
        };
        // Set up an incoming stream and attach it to the image drawing function.
        var incoming = new Writable({
            objectMode: true,
            write: function (msg, encoding, callback) {
                if (msg.type === MessageType.SDP) {
                    // start of a new movie, reset timers
                    clock.reset();
                    scheduler.reset();
                    // Initialize first timestamp and clockrate
                    firstTimestamp = 0;
                    var jpegMedia = msg.sdp.media.find(function (media) {
                        return (media.type === 'video' &&
                            media.rtpmap !== undefined &&
                            media.rtpmap.encodingName === 'JPEG');
                    });
                    if (jpegMedia !== undefined && jpegMedia.rtpmap !== undefined) {
                        clockrate = jpegMedia.rtpmap.clockrate;
                        // Initialize the framerate/bitrate data
                        resetInfo(info);
                        updateInfo = generateUpdateInfo(clockrate);
                    }
                    callback();
                }
                else if (msg.type === MessageType.JPEG) {
                    var timestamp = msg.timestamp, ntpTimestamp = msg.ntpTimestamp;
                    // If first frame, store its timestamp, initialize
                    // the scheduler with 0 and start the clock.
                    // Also set the proper size on the canvas.
                    if (!firstTimestamp) {
                        // Initialize timing
                        firstTimestamp = timestamp;
                        lastTimestamp = timestamp;
                        // Initialize frame size
                        var _a = msg.framesize, width = _a.width, height = _a.height;
                        el.width = width;
                        el.height = height;
                        // Notify that we can play at this point
                        scheduler.init(0);
                    }
                    // Compute millisecond presentation time (with offset 0
                    // as we initialized the scheduler with 0).
                    var presentationTime = (1000 * (timestamp - firstTimestamp)) / clockrate;
                    var blob = new window.Blob([msg.data], { type: 'image/jpeg' });
                    // If the actual UTC time of the start of presentation isn't known yet,
                    // and we do have an ntpTimestamp, then compute it here and notify.
                    if (!ntpPresentationTime && ntpTimestamp) {
                        ntpPresentationTime = ntpTimestamp - presentationTime;
                        onSync(ntpPresentationTime);
                    }
                    scheduler.run({
                        ntpTimestamp: presentationTime,
                        blob: blob,
                    });
                    // Notify that we can now start the clock.
                    if (timestamp === firstTimestamp) {
                        onCanplay();
                    }
                    // Update bitrate/framerate
                    updateInfo(info, {
                        byteLength: msg.data.length,
                        duration: timestamp - lastTimestamp,
                    });
                    lastTimestamp = timestamp;
                    callback();
                }
                else {
                    callback();
                }
            },
        });
        // Set up an outgoing stream.
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
        _this = _super.call(this, incoming, outgoing) || this;
        _this._clock = clock;
        _this._scheduler = scheduler;
        _this._info = info;
        _this.onCanplay = undefined;
        _this.onSync = undefined;
        return _this;
    }
    Object.defineProperty(CanvasSink.prototype, "currentTime", {
        /**
         * Retrieve the current presentation time (seconds)
         *
         * @readonly
         * @memberof CanvasComponent
         */
        get: function () {
            return this._clock.currentTime;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Pause the presentation.
     *
     * @memberof CanvasComponent
     */
    CanvasSink.prototype.pause = function () {
        this._scheduler.suspend();
        this._clock.pause();
    };
    /**
     * Start the presentation.
     *
     * @memberof CanvasComponent
     */
    CanvasSink.prototype.play = function () {
        this._clock.play();
        this._scheduler.resume();
    };
    Object.defineProperty(CanvasSink.prototype, "bitrate", {
        get: function () {
            return this._info.bitrate;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CanvasSink.prototype, "framerate", {
        get: function () {
            return this._info.framerate;
        },
        enumerable: true,
        configurable: true
    });
    return CanvasSink;
}(Sink));
export { CanvasSink };
//# sourceMappingURL=index.js.map